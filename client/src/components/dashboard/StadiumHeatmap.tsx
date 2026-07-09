import { memo } from 'react';
import type { GateData } from '../../types';

interface StadiumHeatmapProps {
  gates: GateData[];
  onGateClick?: (gateId: number) => void;
}

const CROWD_COLORS: Record<string, string> = {
  low: '#10b981',
  moderate: '#f59e0b',
  busy: '#f97316',
  critical: '#ef4444',
};

const CROWD_ICONS: Record<string, string> = {
  low: '✓',
  moderate: '●',
  busy: '▲',
  critical: '!',
};

export default memo(function StadiumHeatmap({ gates, onGateClick }: StadiumHeatmapProps) {
  return (
    <div className="glass-card p-4" id="stadium-heatmap">
      <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
        <span>🏟️</span> Live Stadium View
      </h3>

      <svg viewBox="0 0 100 100" className="w-full h-auto" role="img" aria-label="Stadium map showing crowd levels at each gate">
        {/* Stadium Bowl */}
        <defs>
          <radialGradient id="field-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#166534" />
            <stop offset="100%" stopColor="#14532d" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Bowl */}
        <ellipse cx="50" cy="50" rx="46" ry="44" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <ellipse cx="50" cy="50" rx="42" ry="40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="4" />

        {/* Inner Field */}
        <ellipse cx="50" cy="50" rx="28" ry="22" fill="url(#field-gradient)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
        {/* Field Lines */}
        <line x1="50" y1="28" x2="50" y2="72" stroke="rgba(255,255,255,0.2)" strokeWidth="0.3" />
        <circle cx="50" cy="50" r="6" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.3" />

        {/* Gate Markers */}
        {gates.map((gate) => {
          const color = CROWD_COLORS[gate.crowd_level] ?? '#94a3b8';
          const icon = CROWD_ICONS[gate.crowd_level] ?? '?';
          const isCritical = gate.crowd_level === 'critical';

          return (
            <g
              key={gate.id}
              className="stadium-gate"
              onClick={() => onGateClick?.(gate.id)}
              role="button"
              tabIndex={0}
              aria-label={`${gate.name}: crowd level ${gate.crowd_level}`}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onGateClick?.(gate.id); }}
            >
              {/* Glow effect for busy/critical gates */}
              {(gate.crowd_level === 'busy' || isCritical) && (
                <circle cx={gate.coord_x} cy={gate.coord_y} r="5" fill={color} opacity="0.15" filter="url(#glow)">
                  {isCritical && (
                    <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />
                  )}
                </circle>
              )}

              {/* Gate dot */}
              <circle cx={gate.coord_x} cy={gate.coord_y} r="3" fill={color} stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />

              {/* Gate icon */}
              <text
                x={gate.coord_x}
                y={gate.coord_y + 0.8}
                textAnchor="middle"
                fill="white"
                fontSize="2.5"
                fontWeight="bold"
              >
                {icon}
              </text>

              {/* Gate label */}
              <text
                x={gate.coord_x}
                y={gate.coord_y + 7}
                textAnchor="middle"
                fill="rgba(255,255,255,0.6)"
                fontSize="2.5"
                fontWeight="500"
              >
                G{gate.id}
              </text>

              {/* Crowd level text */}
              <text
                x={gate.coord_x}
                y={gate.coord_y + 10}
                textAnchor="middle"
                fill={color}
                fontSize="2"
                fontWeight="600"
              >
                {gate.crowd_level}
              </text>

              {/* Accessibility indicator */}
              {gate.accessible && (
                <text
                  x={gate.coord_x + 4}
                  y={gate.coord_y - 2}
                  fill="rgba(255,255,255,0.3)"
                  fontSize="2"
                >
                  ♿
                </text>
              )}
            </g>
          );
        })}

        {/* Stadium label */}
        <text x="50" y="50" textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="3.5" fontWeight="700">
          NY/NJ STADIUM
        </text>
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-3 text-xs">
        {Object.entries(CROWD_COLORS).map(([level, color]) => (
          <div key={level} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-white/50">
              {CROWD_ICONS[level]} {level}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
