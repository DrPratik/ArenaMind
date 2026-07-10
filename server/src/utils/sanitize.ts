/**
 * @module sanitize
 * @description Input sanitization utilities for user-provided free text.
 *
 * All user text passes through {@link sanitizeText} before reaching the
 * LLM or being stored in the database. This provides defense-in-depth
 * against prompt injection, log forging, and XSS payloads by:
 *
 * 1. Stripping control characters (common prompt-injection vector)
 * 2. Collapsing runs of whitespace
 * 3. Hard-capping the input length
 *
 * The sanitized result is always treated as **data** (never instructions)
 * by the downstream LLM layer.
 */

/** Maximum allowed length for sanitized user input (characters). */
const MAX_INPUT_LENGTH = 500;

/** Regex to collapse runs of whitespace into a single space. */
const WHITESPACE_COLLAPSE_RE = /\s+/g;

/**
 * Sanitize free-text user input before it reaches the LLM or database.
 *
 * Strips control characters (anything below U+0020 or DEL U+007F),
 * collapses runs of whitespace, trims leading/trailing spaces, and
 * hard-caps the length to prevent abuse.
 *
 * @param text - Raw user input string.
 * @param maxLength - Optional override for the maximum output length.
 * @returns Cleaned, length-capped string safe for downstream use.
 *
 * @example
 * ```ts
 * sanitizeText("  hello\\x00world  \\n\\t  ") // → "hello world"
 * ```
 */
export function sanitizeText(text: string, maxLength: number = MAX_INPUT_LENGTH): string {
  // First normalize whitespace control chars (\n, \r, \t) and non-printable control chars (< 32 or DEL) to space
  const normalized = Array.from(text)
    .map((ch) => {
      const code = ch.charCodeAt(0);
      return code >= 32 && code !== 127 ? ch : ' ';
    })
    .join('');

  // Collapse whitespace runs and trim
  const collapsed = normalized.replace(WHITESPACE_COLLAPSE_RE, ' ').trim();

  // Hard-cap length
  return collapsed.slice(0, maxLength);
}

/**
 * Check whether a string contains potential prompt injection markers.
 *
 * Detects common injection patterns such as "ignore previous instructions",
 * "system prompt", role override attempts, and delimiter-based injections.
 * Returns `true` if suspicious content is detected.
 *
 * @param text - The user input to inspect.
 * @returns `true` if the text contains injection-suspicious patterns.
 */
export function containsInjectionPatterns(text: string): boolean {
  const lowerText = text.toLowerCase();
  const patterns = [
    'ignore previous instructions',
    'ignore all instructions',
    'disregard previous',
    'you are now',
    'act as',
    'pretend to be',
    'system prompt',
    'repeat all',
    '```system',
    '<|im_start|>',
    '<|system|>',
  ];
  return patterns.some((pattern) => lowerText.includes(pattern));
}
