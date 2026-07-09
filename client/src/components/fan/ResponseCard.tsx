import type { ChatMessage } from '../../types';

interface ResponseCardProps {
  message: ChatMessage;
}

export default function ResponseCard({ message }: ResponseCardProps) {
  const card = message.structuredCard;

  return (
    <div className="glass-card p-4 space-y-3">
      {/* Header with tools used */}
      {message.toolsUsed && message.toolsUsed.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {message.toolsUsed.map((tool) => (
            <span key={tool} className="text-[10px] px-2 py-0.5 rounded-full bg-accent-blue/10 text-accent-blue/70 font-medium">
              {toolLabel(tool)}
            </span>
          ))}
        </div>
      )}

      {/* Structured Card */}
      {card && (
        <div className="gradient-bg rounded-xl p-4 border border-accent-blue/10">
          <h3 className="text-sm font-semibold text-accent-cyan mb-2">{card.title}</h3>

          {card.type === 'route' && <RouteCardContent data={card.data} />}
          {card.type === 'food' && <FoodCardContent data={card.data} />}
          {card.type === 'gate_status' && <GateStatusContent data={card.data} />}
          {card.type === 'incident' && <IncidentCardContent data={card.data} />}
          {card.type === 'crowd_forecast' && <ForecastCardContent data={card.data} />}
          {card.type === 'recommendation' && <RecommendationContent data={card.data} />}
          {card.type === 'lost_found' && <LostFoundContent data={card.data} />}
        </div>
      )}

      {/* Text response */}
      <div className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
        {message.text}
      </div>
    </div>
  );
}

// ─── Sub-components for structured cards ──────────────────────────────────

function RouteCardContent({ data }: { data: Record<string, unknown> }) {
  const steps = (data.steps ?? (data.route as Record<string, unknown>)?.steps ?? []) as Array<Record<string, unknown>>;
  const eta = (data.estimatedMinutes ?? (data.route as Record<string, unknown>)?.estimatedMinutes ?? '?') as string;
  const dist = (data.distanceMeters ?? (data.route as Record<string, unknown>)?.distanceMeters ?? '?') as string;
  const toName = ((data.to as Record<string, unknown>)?.name ?? data.name ?? '') as string;

  return (
    <div className="space-y-2">
      {toName && <p className="text-sm font-medium text-white">📍 {toName}</p>}
      <div className="flex gap-4 text-xs text-white/60">
        <span>⏱ {eta} min</span>
        <span>📏 {dist} m</span>
      </div>
      <ol className="space-y-2 mt-2">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-blue/20 text-accent-blue text-xs font-bold flex items-center justify-center">
              {i + 1}
            </span>
            <span className="text-sm text-white/70">{step.instruction as string}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function FoodCardContent({ data }: { data: Record<string, unknown> }) {
  const stalls = (data.stalls ?? []) as Array<Record<string, unknown>>;
  return (
    <div className="space-y-2">
      {stalls.slice(0, 5).map((stall) => (
        <div key={stall.id as number} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
          <div>
            <p className="text-sm font-medium text-white">{stall.name as string}</p>
            <p className="text-xs text-white/40">
              {((stall.cuisineTags ?? []) as string[]).join(', ')}
            </p>
          </div>
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
            (stall.currentQueueMinutes as number) <= 5 ? 'bg-accent-emerald/15 text-accent-emerald' :
            (stall.currentQueueMinutes as number) <= 10 ? 'bg-accent-amber/15 text-accent-amber' :
            'bg-accent-crimson/15 text-accent-crimson'
          }`}>
            {stall.currentQueueMinutes as number} min
          </span>
        </div>
      ))}
    </div>
  );
}

function GateStatusContent({ data }: { data: Record<string, unknown> }) {
  const gate = data.gate as Record<string, unknown> | undefined;
  const alt = data.alternativeGate as Record<string, unknown> | undefined;

  if (!gate) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-white">{gate.name as string}</span>
        <CrowdBadge level={gate.current_crowd_level as string} />
      </div>
      {alt && (
        <div className="mt-2 p-3 rounded-lg bg-accent-emerald/10 border border-accent-emerald/20">
          <p className="text-xs text-accent-emerald font-medium">💡 Suggested alternative:</p>
          <p className="text-sm text-white mt-1">{alt.name as string} — <CrowdBadge level={alt.current_crowd_level as string} /></p>
        </div>
      )}
    </div>
  );
}

function IncidentCardContent({ data }: { data: Record<string, unknown> }) {
  const incident = (data.incident ?? data) as Record<string, unknown>;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className={`crowd-badge priority-${incident.priority as string}`}>{incident.priority as string}</span>
        <span className="text-xs text-white/50">{incident.type as string}</span>
      </div>
      <p className="text-sm text-white/70">{incident.suggested_department as string}</p>
    </div>
  );
}

function ForecastCardContent({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-white">{data.gateName as string}</span>
        <div className="flex items-center gap-2">
          <CrowdBadge level={data.currentLevel as string} />
          <span className="text-white/40">→</span>
          <CrowdBadge level={data.forecastLevel as string} />
        </div>
      </div>
      <p className="text-xs text-white/60">{data.reasoning as string}</p>
    </div>
  );
}

function RecommendationContent({ data }: { data: Record<string, unknown> }) {
  const gates = (data.gatesAtRisk ?? []) as Array<Record<string, unknown>>;
  return (
    <div className="space-y-2">
      {gates.map((g) => (
        <div key={g.gateId as number} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
          <span className="text-sm text-white">{g.gateName as string}</span>
          <div className="flex items-center gap-2">
            <CrowdBadge level={g.currentLevel as string} />
            <span className="text-white/30">→</span>
            <CrowdBadge level={g.forecastLevel as string} />
          </div>
        </div>
      ))}
    </div>
  );
}

function LostFoundContent({ data }: { data: Record<string, unknown> }) {
  const items = (data.items ?? []) as Array<Record<string, unknown>>;
  if (items.length === 0) return <p className="text-sm text-white/50">No matching items found.</p>;
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id as number} className="py-1.5 border-b border-white/5 last:border-0">
          <p className="text-sm text-white">{item.description as string}</p>
          <p className="text-xs text-white/40">📍 {item.location_found as string}</p>
        </div>
      ))}
    </div>
  );
}

function CrowdBadge({ level }: { level: string }) {
  const icons: Record<string, string> = { low: '🟢', moderate: '🟡', busy: '🟠', critical: '🔴' };
  return (
    <span className={`crowd-badge crowd-${level}`}>
      <span role="img" aria-label={level}>{icons[level] ?? '⚪'}</span>
      {level}
    </span>
  );
}

function toolLabel(tool: string): string {
  const labels: Record<string, string> = {
    getGateStatus: '🚪 Gate Status',
    getRoute: '🗺️ Route',
    getFoodQueue: '🍔 Food',
    getCrowdForecast: '📊 Forecast',
    fileIncident: '📝 Incident',
    searchLostFound: '🔍 Lost & Found',
    findNearestAmenity: '📍 Amenity',
    getOverloadRisk: '⚠️ Risk',
  };
  return labels[tool] ?? tool;
}
