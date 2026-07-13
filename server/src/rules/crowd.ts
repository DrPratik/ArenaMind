/**
 * @module rules/crowd
 * @description Predictive crowd forecasting and overload risk analysis rules engine.
 *
 * Implements linear trend extrapolation over time-series crowd logs to predict
 * gate congestion N minutes ahead, and identifies gates at risk of critical overload.
 */

import type { DatabaseSync } from 'node:sqlite';
import type { CrowdLevel, CrowdLogEntry } from '../types.js';

export interface CrowdForecastResult {
  gateId: number;
  gateName: string;
  currentLevel: CrowdLevel;
  forecastLevel: CrowdLevel;
  trend: 'rising' | 'stable' | 'falling';
  trendPercentage: number;
  minutesAhead: number;
  reasoning: string;
}

export interface OverloadRiskResult {
  gatesAtRisk: Array<{
    gateId: number;
    gateName: string;
    currentLevel: CrowdLevel;
    forecastLevel: CrowdLevel;
    trend: 'rising' | 'stable' | 'falling';
    trendPercentage: number;
    estimatedMinutesToCritical: number | null;
    severity?: string;
    action?: string;
  }>;
}

const LEVEL_VALUES: Record<CrowdLevel, number> = {
  low: 1,
  moderate: 2,
  busy: 3,
  critical: 4,
};

const VALUE_LEVELS: Record<number, CrowdLevel> = {
  1: 'low',
  2: 'moderate',
  3: 'busy',
  4: 'critical',
};

/**
 * Forecast crowd level for a gate N minutes ahead using linear trend extrapolation
 * over the most recent crowd_log entries.
 */
export function getCrowdForecast(
  db: DatabaseSync,
  gateId: number,
  minutesAhead = 20,
): CrowdForecastResult | null {
  const gate = db.prepare('SELECT * FROM gates WHERE id = ?').get(gateId) as
    | { id: number; name: string; current_crowd_level: CrowdLevel }
    | undefined;

  if (!gate) return null;

  // Get last 7 crowd_log entries for this gate
  const logs = db
    .prepare(
      'SELECT * FROM crowd_log WHERE gate_id = ? ORDER BY timestamp DESC LIMIT 7',
    )
    .all(gateId) as unknown as CrowdLogEntry[];

  if (logs.length < 2) {
    return {
      gateId,
      gateName: gate.name,
      currentLevel: gate.current_crowd_level,
      forecastLevel: gate.current_crowd_level,
      trend: 'stable',
      trendPercentage: 0,
      minutesAhead,
      reasoning: `Not enough historical data to forecast. Current level is ${gate.current_crowd_level}.`,
    };
  }

  // Compute trend: compare average of recent half vs older half
  const recentHalf = logs.slice(0, Math.ceil(logs.length / 2));
  const olderHalf = logs.slice(Math.ceil(logs.length / 2));

  const recentAvg = recentHalf.reduce((sum, l) => sum + LEVEL_VALUES[l.crowd_level], 0) / recentHalf.length;
  const olderAvg = olderHalf.reduce((sum, l) => sum + LEVEL_VALUES[l.crowd_level], 0) / olderHalf.length;

  const trendSlope = recentAvg - olderAvg;
  const trendPercentage = olderAvg > 0 ? Math.round((trendSlope / olderAvg) * 100) : 0;

  let trend: 'rising' | 'stable' | 'falling';
  if (trendSlope > 0.3) trend = 'rising';
  else if (trendSlope < -0.3) trend = 'falling';
  else trend = 'stable';

  // Simple linear extrapolation
  // Each log entry represents ~10 min intervals, so extrapolation factor:
  const extrapolationFactor = minutesAhead / 10;
  const forecastValue = Math.round(Math.min(4, Math.max(1, recentAvg + trendSlope * extrapolationFactor)));
  const forecastLevel = VALUE_LEVELS[forecastValue] ?? gate.current_crowd_level;

  const reasoning = buildReasoning(gate.name, gate.current_crowd_level, forecastLevel, trend, trendPercentage, minutesAhead);

  return {
    gateId,
    gateName: gate.name,
    currentLevel: gate.current_crowd_level,
    forecastLevel,
    trend,
    trendPercentage,
    minutesAhead,
    reasoning,
  };
}

/**
 * Identify all gates at risk of reaching critical levels.
 */
export function getOverloadRisk(db: DatabaseSync): OverloadRiskResult {
  const gates = db.prepare('SELECT * FROM gates ORDER BY id').all() as Array<{
    id: number;
    name: string;
    current_crowd_level: CrowdLevel;
  }>;

  const gatesAtRisk = gates
    .map((gate) => {
      const forecast = getCrowdForecast(db, gate.id, 20);
      if (!forecast) return null;

      const current = gate.current_crowd_level;
      const trend = forecast.trendPercentage;

      const forecastLevel = forecast.forecastLevel;
      let reasoning = `stable ${trend}%`;
      let timeToCritical: number | null = null;
      let severity = 'LOW';
      let action = 'Monitor passively.';

      if (trend > 20) {
        reasoning = `rising ${trend}%`;
        if (current === 'busy') {
          timeToCritical = Math.max(5, Math.floor(1000 / trend));
        } else if (current === 'moderate') {
          timeToCritical = Math.max(15, Math.floor(2000 / trend));
        }
      } else if (trend < -20) {
        reasoning = `falling ${Math.abs(trend)}%`;
      }

      if (timeToCritical !== null && timeToCritical <= 15) {
        severity = 'SEVERE';
        action = `CRITICAL: Broadcast immediate dispatch to Gate ${gate.id} volunteers. Open overflow lanes immediately.`;
      } else if (timeToCritical !== null && timeToCritical <= 30) {
        severity = 'WARNING';
        action = `Prepare to redirect fan traffic away from Gate ${gate.id} within 15 mins.`;
      }

      if (forecastLevel === 'busy' || forecastLevel === 'critical') {
        return {
          gateId: gate.id,
          gateName: gate.name,
          currentLevel: current,
          forecastLevel,
          trend: forecast.trend,
          trendPercentage: trend,
          estimatedMinutesToCritical: timeToCritical,
          severity,
          action,
        };
      }
      return null;
    })
    .filter(Boolean) as OverloadRiskResult['gatesAtRisk'];

  return { gatesAtRisk };
}

function buildReasoning(
  gateName: string,
  currentLevel: CrowdLevel,
  forecastLevel: CrowdLevel,
  trend: string,
  trendPercentage: number,
  minutesAhead: number,
): string {
  const absPct = Math.abs(trendPercentage);
  if (trend === 'rising') {
    return `${gateName} crowd density is trending upward (${absPct}% increase over recent intervals). ` +
      `Currently ${currentLevel}, forecast to reach ${forecastLevel} in the next ${minutesAhead} minutes. ` +
      `Recommend deploying additional volunteers or redirecting fans to less crowded gates.`;
  }
  if (trend === 'falling') {
    return `${gateName} crowd density is decreasing (${absPct}% drop). ` +
      `Currently ${currentLevel}, expected to ease to ${forecastLevel} in ${minutesAhead} minutes.`;
  }
  return `${gateName} crowd density is stable at ${currentLevel}. No significant change expected in the next ${minutesAhead} minutes.`;
}
