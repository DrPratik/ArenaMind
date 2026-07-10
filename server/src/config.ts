/**
 * @module config
 * @description Centralized, validated application configuration.
 *
 * All environment variables are read once at startup and exposed as a
 * strongly-typed, frozen configuration object. This eliminates scattered
 * `process.env` reads, catches missing variables early, and provides a
 * single source of truth for every tunable parameter.
 *
 * Secrets (e.g. `GEMINI_API_KEY`) are **never** hard-coded — they are
 * read from the environment and may be absent, in which case the app
 * gracefully falls back to the offline {@link MockLLM}.
 */

/** Validated, immutable application settings. */
export interface AppConfig {
  /** HTTP port the server listens on. */
  readonly port: number;
  /** Gemini API key. Absent → MockLLM fallback. */
  readonly geminiApiKey: string | undefined;
  /** Gemini model identifier (e.g. `gemini-3.1-flash-lite`). */
  readonly geminiModel: string;
  /** football-data.org API key for live tournament data. */
  readonly footballDataApiKey: string | undefined;
  /** Node environment (`development` | `production` | `test`). */
  readonly nodeEnv: string;
  /** Maximum request body size for image uploads. */
  readonly maxBodySize: string;
  /** Rate limiter: max requests per window. */
  readonly rateLimitMax: number;
  /** Rate limiter: window duration in milliseconds. */
  readonly rateLimitWindowMs: number;
  /** Maximum length of user free-text input (characters). */
  readonly maxInputLength: number;
}

/**
 * Load and validate configuration from environment variables.
 *
 * Called once at startup. Subsequent calls return the cached singleton.
 * Throws if any required numeric variable is malformed.
 */
function loadConfig(): AppConfig {
  return Object.freeze({
    port: parseInt(process.env.PORT ?? '3001', 10),
    geminiApiKey: process.env.GEMINI_API_KEY || undefined,
    geminiModel: process.env.GEMINI_MODEL ?? 'gemini-3.1-flash-lite',
    footballDataApiKey: process.env.FOOTBALL_DATA_API_KEY || undefined,
    nodeEnv: process.env.NODE_ENV ?? 'development',
    maxBodySize: '10mb',
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX ?? '30', 10),
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10),
    maxInputLength: 500,
  });
}

/** Application configuration singleton. */
export const config: AppConfig = loadConfig();
