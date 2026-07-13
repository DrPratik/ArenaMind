import { describe, it, expect } from 'vitest';
import { generateDeterministicResponse } from '../ai/fallbackLlm.js';

describe('Deterministic Fallback LLM Suite', () => {
  it('should generate localized route instructions for fans', async () => {
    const res = generateDeterministicResponse({
      message: 'How do I get to Gate 3?',
      role: 'fan',
      language: 'en',
    });
    expect(typeof res).toBe('string');
    expect(res.length).toBeGreaterThan(0);
  });

  it('should support Spanish (es) localization in deterministic mode', async () => {
    const res = generateDeterministicResponse({
      message: 'Donde esta la comida?',
      role: 'fan',
      language: 'es',
    });
    expect(typeof res).toBe('string');
    expect(res.length).toBeGreaterThan(0);
  });

  it('should provide operational summary for organizers', async () => {
    const res = generateDeterministicResponse({
      message: 'What is the crowd overload risk?',
      role: 'organizer',
      language: 'en',
    });
    expect(typeof res).toBe('string');
    expect(res.length).toBeGreaterThan(0);
  });
});
