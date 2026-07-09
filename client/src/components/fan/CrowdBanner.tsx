import { useCrowd } from '../../hooks/useCrowd';
import { useState } from 'react';

export default function CrowdBanner() {
  const { busyGates } = useCrowd();
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const visibleAlerts = busyGates.filter((g) => !dismissed.has(g.id));

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="space-y-2" role="alert" aria-live="polite" id="crowd-banner">
      {visibleAlerts.map((gate) => (
        <div key={gate.id} className="crowd-banner flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-lg flex-shrink-0" role="img" aria-label="Warning">
              {gate.crowd_level === 'critical' ? '🔴' : '🟠'}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">
                {gate.name} is {gate.crowd_level}
              </p>
              <p className="text-xs text-white/60">
                Consider using a nearby gate for faster entry
              </p>
            </div>
          </div>
          <button
            onClick={() => setDismissed((prev) => new Set([...prev, gate.id]))}
            className="flex-shrink-0 p-1 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
            aria-label={`Dismiss alert for ${gate.name}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
