/**
 * Data structure representing a gate's predicted crowd overload risk.
 */
interface CrowdRisk {
  gateId: number;
  gateName: string;
  currentLevel: string;
  forecastLevel: string;
  severity: 'MODERATE' | 'SEVERE';
  estimatedMinutesToCritical?: number;
  reasoning: string;
  action?: string;
}

/**
 * Payload structure received from the useCrowd hook's overloadRisk object.
 */
interface OverloadRiskData {
  gatesAtRisk: CrowdRisk[];
}

/**
 * Props for the CrowdForecaster component.
 */
interface CrowdForecasterProps {
  /** The overload risk payload provided by the crowd rules engine */
  overloadRisk: OverloadRiskData | null;
}

/**
 * CrowdForecaster displays a live 30-minute predictive forecast of crowd congestion.
 * It alerts organizers to gates that are trending toward critical capacity, providing AI-generated reasoning and actions.
 * 
 * @param props The properties passed to the component, specifically the overloadRisk data.
 */
export default function CrowdForecaster({ overloadRisk }: CrowdForecasterProps) {
  if (!overloadRisk || overloadRisk.gatesAtRisk.length === 0) return null;

  return (
    <div className="glass-card p-4 border-l-2 border-accent-amber animate-fade-in">
      <h3 className="text-sm font-semibold text-accent-amber mb-3 flex items-center gap-2">
        <span>⚠️</span> 30-Min Predictive Crowd Forecaster
      </h3>
      <div className="space-y-3">
        {overloadRisk.gatesAtRisk.map((risk: CrowdRisk) => {
          const isSevere = risk.severity === 'SEVERE';
          return (
            <div key={risk.gateId} className={`flex flex-col gap-2 p-3 rounded-lg border ${isSevere ? 'bg-red-500/10 border-red-500/50 animate-pulse' : 'bg-white/5 border-white/5'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className={`font-bold ${isSevere ? 'text-red-400' : 'text-white'}`}>
                    {isSevere ? '🚨 SEVERE RISK: ' : ''}{risk.gateName}
                  </span>
                  <p className="text-xs text-white/60 mt-1">
                    {risk.reasoning} 
                    {risk.estimatedMinutesToCritical && ` • ~${risk.estimatedMinutesToCritical} mins to critical`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded bg-white/10 text-white/70">{risk.currentLevel}</span>
                  <span className="text-white/40">→</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${risk.forecastLevel === 'critical' ? 'bg-accent-crimson text-white' : 'bg-accent-amber text-white'}`}>
                    {risk.forecastLevel}
                  </span>
                </div>
              </div>
              {risk.action && (
                <div className={`text-xs p-2 rounded ${isSevere ? 'bg-red-500/20 text-red-200 font-bold' : 'bg-white/10 text-white/70'}`}>
                  {risk.action}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
