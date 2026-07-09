import { describe, it, expect } from 'vitest';
import { calculateTimeToCritical } from '../rules/crowd.js';

describe('Crowd Rules Engine', () => {
  it('calculates SEVERE severity for rapidly rising crowds', () => {
    // Current level is 'busy', was 'low' 30 mins ago. It's increasing.
    const history = [
      { crowd_level: 'busy', timestamp: new Date().toISOString() },
      { crowd_level: 'moderate', timestamp: new Date(Date.now() - 15 * 60000).toISOString() },
      { crowd_level: 'low', timestamp: new Date(Date.now() - 30 * 60000).toISOString() },
    ];

    const risk = calculateTimeToCritical(8, history);

    // It should forecast critical and trigger SEVERE severity
    expect(risk).toBeDefined();
    expect(risk?.forecastLevel).toBe('critical');
    expect(risk?.severity).toBe('SEVERE');
    expect(risk?.action).toContain('Dispatch volunteers');
  });

  it('calculates MODERATE severity for stable or slow-rising crowds', () => {
    // Current level is 'busy', was 'busy' 30 mins ago. It's stable.
    const history = [
      { crowd_level: 'busy', timestamp: new Date().toISOString() },
      { crowd_level: 'busy', timestamp: new Date(Date.now() - 15 * 60000).toISOString() },
      { crowd_level: 'busy', timestamp: new Date(Date.now() - 30 * 60000).toISOString() },
    ];

    const risk = calculateTimeToCritical(4, history);

    expect(risk).toBeDefined();
    expect(risk?.forecastLevel).toBe('busy');
    expect(risk?.severity).toBe('MODERATE');
    expect(risk?.action).toContain('Monitor');
  });

  it('returns null if there is not enough history or crowd is low', () => {
    const history = [
      { crowd_level: 'low', timestamp: new Date().toISOString() }
    ];

    const risk = calculateTimeToCritical(1, history);
    expect(risk).toBeNull();
  });
});
