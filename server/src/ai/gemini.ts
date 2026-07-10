/**
 * @module gemini
 * @description Core AI orchestration layer for ArenaMind.
 *
 * Implements the "rules decide, LLM phrases" architecture:
 * 1. User messages are sanitized and forwarded to the Gemini model.
 * 2. Gemini selects tools (function calls) based on intent.
 * 3. Tool calls are executed against the deterministic rules engine.
 * 4. Resolved facts are returned to Gemini for natural-language phrasing.
 *
 * If the Gemini API is unavailable (no key or quota exceeded), the system
 * transparently falls back to {@link MockLLM} with keyword-based intent
 * detection, ensuring the app never crashes or returns empty responses.
 */

import { GoogleGenerativeAI, type FunctionDeclaration } from '@google/generative-ai';
import type { DatabaseSync } from 'node:sqlite';
import type { UserRole, SupportedLanguage, ToolCallResult, AskResponse, StructuredCard } from '../types.js';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { sanitizeText } from '../utils/sanitize.js';
import { getSystemPrompt } from './prompts.js';
import { toolDeclarations } from './tools.js';
import { generateMockResponse } from './mockLlm.js';
import * as rules from '../rules/index.js';
import type { RouteMode, IncidentType } from '../types.js';

let genAI: GoogleGenerativeAI | null = null;

/**
 * Lazily initialize and cache the Google Generative AI client.
 * Returns `null` if no API key is configured, triggering the MockLLM fallback.
 */
function getGenAI(): GoogleGenerativeAI | null {
  if (genAI) return genAI;
  if (!config.geminiApiKey) return null;
  genAI = new GoogleGenerativeAI(config.geminiApiKey);
  return genAI;
}

/**
 * Execute a tool call against the deterministic rules layer.
 *
 * The LLM selects which tool to invoke, but all data resolution happens
 * through hardcoded algorithms (SQL queries, graph traversal, severity
 * matrices) — the LLM never generates facts, only selects tools.
 *
 * @param db - SQLite database handle.
 * @param toolName - Name of the tool the LLM selected.
 * @param args - Arguments extracted by the LLM from the user message.
 * @returns Resolved data from the rules engine, or an error object.
 */
function executeToolCall(
  db: DatabaseSync,
  toolName: string,
  args: Record<string, unknown>,
): Record<string, unknown> {
  switch (toolName) {
    case 'getGateStatus': {
      const result = rules.getGateStatus(db, args.gateId as number);
      return result ? (result as unknown as Record<string, unknown>) : { error: 'Gate not found' };
    }
    case 'getRoute': {
      const result = rules.getRoute(
        db,
        (args.fromType as string) ?? 'gate',
        args.fromId as number,
        (args.toType as string) ?? 'gate',
        args.toId as number,
        (args.mode as RouteMode) ?? 'standard',
      );
      return result ? (result as unknown as Record<string, unknown>) : { error: 'Route not found' };
    }
    case 'getFoodQueue': {
      if (args.tags && Array.isArray(args.tags) && (args.tags as string[]).length > 0) {
        const result = rules.findFoodByPreference(db, args.tags as string[]);
        return { stalls: result };
      }
      const result = rules.getFoodQueue(db, args.stallId as number | undefined);
      return { stalls: result };
    }
    case 'getCrowdForecast': {
      const result = rules.getCrowdForecast(db, args.gateId as number, (args.minutesAhead as number) ?? 20);
      return result ? (result as unknown as Record<string, unknown>) : { error: 'Gate not found' };
    }
    case 'fileIncident': {
      const result = rules.fileIncident(db, {
        type: args.type as IncidentType,
        location: args.location as string,
        gateId: args.gateId as number,
        note: args.note as string,
        photoUrl: args.photoUrl as string | undefined,
      });
      return result as unknown as Record<string, unknown>;
    }
    case 'searchLostFound': {
      const result = rules.searchLostFound(db, args.description as string);
      return result as unknown as Record<string, unknown>;
    }
    case 'findNearestAmenity': {
      const result = rules.findNearestAmenity(db, args.gateId as number, args.amenityType as string);
      return result ? (result as unknown as Record<string, unknown>) : { error: 'Amenity not found' };
    }
    case 'getOverloadRisk': {
      const result = rules.getOverloadRisk(db);
      return result as unknown as Record<string, unknown>;
    }
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

/**
 * Build a structured UI card from tool results for the frontend.
 *
 * Maps each tool name to a card type (route, food, gate_status, etc.)
 * so the React frontend can render rich, contextual result cards.
 *
 * @param toolResults - Array of resolved tool call results.
 * @returns A structured card for the primary tool result, or `undefined`.
 */
function buildStructuredCard(toolResults: ToolCallResult[]): StructuredCard | undefined {
  if (toolResults.length === 0) return undefined;

  const primary = toolResults[0];
  const data = primary.result;

  switch (primary.toolName) {
    case 'getGateStatus':
      return {
        type: 'gate_status',
        title: `Gate Status`,
        data,
      };
    case 'getRoute':
      return {
        type: 'route',
        title: 'Route',
        data,
      };
    case 'getFoodQueue':
      return {
        type: 'food',
        title: 'Food Options',
        data,
      };
    case 'getCrowdForecast':
      return {
        type: 'crowd_forecast',
        title: 'Crowd Forecast',
        data,
      };
    case 'fileIncident':
      return {
        type: 'incident',
        title: 'Incident Report',
        data,
      };
    case 'searchLostFound':
      return {
        type: 'lost_found',
        title: 'Lost & Found',
        data,
      };
    case 'getOverloadRisk':
      return {
        type: 'recommendation',
        title: 'Overload Risk Assessment',
        data,
      };
    case 'findNearestAmenity':
      return {
        type: 'route',
        title: 'Nearest Amenity',
        data,
      };
    default:
      return undefined;
  }
}

/**
 * Main AI handler — the central entry point for all user queries.
 *
 * Implements the full "rules decide, LLM phrases" pipeline:
 * 1. Sanitizes user input to strip control chars and cap length.
 * 2. If Gemini is available, forwards the sanitized message with function declarations.
 * 3. Executes any tool calls against the deterministic rules layer.
 * 4. Returns the LLM-phrased response with structured UI cards.
 * 5. On any Gemini failure (quota, network), gracefully falls back to MockLLM.
 *
 * @param db - SQLite database handle.
 * @param role - The user's role (fan, volunteer, organizer).
 * @param message - Raw user message (will be sanitized).
 * @param language - Response language code.
 * @param imageBase64 - Optional base64-encoded image for multimodal queries.
 * @returns AI response with text, structured card, and list of tools used.
 */
export async function handleAskRequest(
  db: DatabaseSync,
  role: UserRole,
  message: string,
  language: SupportedLanguage,
  imageBase64?: string,
): Promise<AskResponse> {
  // Sanitize user input before any processing
  const cleanMessage = sanitizeText(message);
  const ai = getGenAI();

  if (!ai) {
    return handleWithMockLLM(db, role, cleanMessage, language);
  }

  // Fetch ticket context if fan
  let ticketInfo: { gate_id: number; section: string; seat: string } | undefined;
  if (role === 'fan') {
    const ticket = db.prepare("SELECT gate_id, section, seat FROM tickets WHERE persona_id = 1 AND status = 'valid'").get() as { gate_id: number; section: string; seat: string } | undefined;
    if (ticket) ticketInfo = ticket;
  }

  try {
    const model = ai.getGenerativeModel({
      model: config.geminiModel,
      tools: [{
        functionDeclarations: toolDeclarations as FunctionDeclaration[],
      }],
      systemInstruction: getSystemPrompt(role, language, ticketInfo),
    });

    const chat = model.startChat();

    // Build the user message parts
    const messageParts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: cleanMessage },
    ];

    if (imageBase64) {
      messageParts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBase64,
        },
      });
    }

    let result = await chat.sendMessage(messageParts);
    const toolResults: ToolCallResult[] = [];

    // Handle function calling loop (max 5 iterations for safety)
    let iterations = 0;
    while (iterations < 5) {
      const response = result.response;
      const functionCalls = response.functionCalls();

      if (!functionCalls || functionCalls.length === 0) break;

      const functionResponses = functionCalls.map((call) => {
        const toolResult = executeToolCall(db, call.name, call.args as Record<string, unknown>);
        toolResults.push({ toolName: call.name, result: toolResult });
        return {
          functionResponse: {
            name: call.name,
            response: { result: toolResult },
          },
        };
      });

      result = await chat.sendMessage(functionResponses);
      iterations++;
    }

    const responseText = result.response.text();
    const structuredCard = buildStructuredCard(toolResults);

    return {
      text: responseText,
      structuredCard,
      toolsUsed: toolResults.map((t) => t.toolName),
    };
  } catch (error) {
    logger.warn('Gemini API error, falling back to MockLLM', {
      error: error instanceof Error ? error.message : String(error),
    });
    return handleWithMockLLM(db, role, cleanMessage, language);
  }
}

/**
 * Deterministic fallback when Gemini is unavailable.
 *
 * Detects user intent via keyword matching, resolves facts through the
 * rules engine, and formats responses using pre-built templates.
 * Guarantees the app always produces a meaningful answer, even offline.
 *
 * @param db - SQLite database handle.
 * @param role - The user's role.
 * @param message - Sanitized user message.
 * @param language - Response language code.
 * @returns Fully formed response with text, card, and tools used.
 */
function handleWithMockLLM(
  db: DatabaseSync,
  role: UserRole,
  message: string,
  language: SupportedLanguage,
): AskResponse {
  const toolResults = detectIntentAndResolve(db, message, role);
  const text = generateMockResponse({ role, message, language, toolResults });
  const structuredCard = buildStructuredCard(toolResults);

  return {
    text,
    structuredCard,
    toolsUsed: toolResults.map((t) => t.toolName),
  };
}

/**
 * Keyword-based intent detection for the MockLLM fallback path.
 *
 * Scans the user message for multilingual keywords (EN, ES, PT, FR, HI, AR)
 * and maps detected intents to deterministic rules-engine calls. Supports
 * gate queries, amenity searches, food preferences, incident filing,
 * crowd forecasting, and accessibility routing.
 *
 * @param db - SQLite database handle.
 * @param message - Sanitized user message.
 * @param role - The user's role (determines which tools are available).
 * @returns Array of tool call results from the rules engine.
 */
function detectIntentAndResolve(
  db: DatabaseSync,
  message: string,
  role: UserRole,
): ToolCallResult[] {
  const lower = message.toLowerCase();
  const results: ToolCallResult[] = [];

  // Gate status queries
  if (/gate|puerta|portão|porte|गेट|بوابة/i.test(lower)) {
    const numMatch = lower.match(/\b(\d+)\b/);
    const gateId = numMatch ? parseInt(numMatch[1], 10) : 4;
    const status = rules.getGateStatus(db, gateId);
    if (status) {
      results.push({ toolName: 'getGateStatus', result: status as unknown as Record<string, unknown> });
    }
  }

  // Multilingual translation assistance
  if (/translat|traduc|traduir|अनुवाद|ترجم/i.test(lower)) {
    const gateId = 4;
    const status = rules.getGateStatus(db, gateId);
    if (status) {
      results.push({ toolName: 'getGateStatus', result: status as unknown as Record<string, unknown> });
    }
  }

  // Restroom queries
  if (/restroom|bathroom|toilet|baño|banheiro|toilette|शौचालय|حمام/i.test(lower)) {
    const gateId = extractGateId(lower) ?? 1;
    const nearest = rules.findNearestAmenity(db, gateId, 'restroom');
    if (nearest) {
      results.push({ toolName: 'findNearestAmenity', result: nearest as unknown as Record<string, unknown> });
    }
  }

  // Food queries
  if (/food|eat|hungry|comida|comer|nourriture|manger|खाना|طعام|halal|veg|vegetarian/i.test(lower)) {
    const tags: string[] = [];
    if (/halal/i.test(lower)) tags.push('halal');
    if (/veg|vegetarian/i.test(lower)) tags.push('veg');
    if (/gluten.?free/i.test(lower)) tags.push('gluten_free');

    const stalls = tags.length > 0 ? rules.findFoodByPreference(db, tags) : rules.getFoodQueue(db);
    results.push({ toolName: 'getFoodQueue', result: { stalls } });
  }

  // Medical queries
  if (/medical|first.?aid|doctor|nurse|help|emergenc|médico|médica|ayuda|aide|मदद|طبي/i.test(lower)) {
    const gateId = extractGateId(lower) ?? 1;
    const nearest = rules.findNearestAmenity(db, gateId, 'medical');
    if (nearest) {
      results.push({ toolName: 'findNearestAmenity', result: nearest as unknown as Record<string, unknown> });
    }
  }

  // Lost & found
  if (/lost|found|missing|perdido|perdida|perdu|trouvé|खोया|मिला|مفقود/i.test(lower)) {
    const searchResult = rules.searchLostFound(db, message);
    results.push({ toolName: 'searchLostFound', result: searchResult as unknown as Record<string, unknown> });
  }

  // Crowd / overload queries (organizer)
  if (/overload|crowd|capacity|forecast|busy|which gate|tendencia|pronóstico|भीड़|ازدحام/i.test(lower) && role === 'organizer' && !/divert|dispatch|broadcast/.test(lower)) {
    const risk = rules.getOverloadRisk(db);
    results.push({ toolName: 'getOverloadRisk', result: risk as unknown as Record<string, unknown> });
  }

  // Divert / Broadcast / Dispatch (Organizer)
  if (/divert|dispatch|broadcast|send/i.test(lower) && role === 'organizer') {
    const fromGate = extractGateId(lower) ?? 8;
    const result = rules.fileIncident(db, {
      type: 'crowd',
      location: `Gate ${fromGate}`,
      gateId: fromGate,
      note: `DIRECTIVE: ${message}`,
    });
    results.push({ toolName: 'fileIncident', result: result as unknown as Record<string, unknown> });
  }

  // Wheelchair route
  if (/wheelchair|accessible|accesible|acessível|fauteuil|व्हीलचेयर|كرسي متحرك/i.test(lower)) {
    const gateId = extractGateId(lower) ?? 1;
    const route = rules.getRoute(db, 'gate', gateId, 'gate', gateId === 8 ? 6 : 1, 'wheelchair');
    if (route) {
      results.push({ toolName: 'getRoute', result: route as unknown as Record<string, unknown> });
    }
  }

  // Prayer room
  if (/prayer|pray|mosque|masjid|oración|rezar|prière|namaz|صلاة/i.test(lower)) {
    const gateId = extractGateId(lower) ?? 1;
    const nearest = rules.findNearestAmenity(db, gateId, 'prayer_room');
    if (nearest) {
      results.push({ toolName: 'findNearestAmenity', result: nearest as unknown as Record<string, unknown> });
    }
  }

  // If nothing matched, try gate status for gate 1 as a safe fallback
  if (results.length === 0) {
    // For organizer role, show overload risk as default
    if (role === 'organizer') {
      const risk = rules.getOverloadRisk(db);
      results.push({ toolName: 'getOverloadRisk', result: risk as unknown as Record<string, unknown> });
    }
    // No results means we don't have data — MockLLM will show "ask a volunteer"
  }

  return results;
}

/**
 * Extract a gate ID (1–8) from multilingual user text.
 *
 * Matches patterns like "gate 4", "puerta 2", "portão 3", "porte 5".
 * Returns `null` if no valid gate reference is found.
 *
 * @param text - User message to scan.
 * @returns Gate ID (1–8) or `null`.
 */
function extractGateId(text: string): number | null {
  const match = text.match(/gate\s*(\d+)|puerta\s*(\d+)|portão\s*(\d+)|porte\s*(\d+)|near\s*(\d+)/i);
  if (match) {
    const id = parseInt(match[1] ?? match[2] ?? match[3] ?? match[4] ?? match[5], 10);
    if (id >= 1 && id <= 8) return id;
  }
  return null;
}
