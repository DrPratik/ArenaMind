import { useState, useEffect, useCallback } from 'react';
import { useCrowd } from '../../hooks/useCrowd';
import StadiumHeatmap from './StadiumHeatmap';
import IncidentFeed from './IncidentFeed';
import CrowdForecaster from './CrowdForecaster';
import LostFanScanner from './LostFanScanner';
import OpsAssistant from './OpsAssistant';
import { updateCrowdLevel, getOrganizerBriefing } from '../../api/client';
import type { GateData } from '../../types';

export default function DashboardHome() {
  const { gates, overloadRisk, refresh } = useCrowd(5000); // Poll faster for the dashboard
  const [selectedGateId, setSelectedGateId] = useState<number | null>(null);
  const selectedGate: GateData | null = gates.find(g => g.id === selectedGateId) || null;
  const [briefing, setBriefing] = useState<string>('');

  // Auto-generate briefing on load
  useEffect(() => {
    async function loadBriefing() {
      try {
        const res = await getOrganizerBriefing();
        setBriefing(res.briefing);
      } catch {
        setBriefing('Unable to load briefing.');
      }
    }
    loadBriefing();
  }, []);

  const handleGateClick = useCallback((gateId: number) => {
    setSelectedGateId(gateId);
  }, []);

  const handleLevelChange = async (newLevel: string) => {
    if (!selectedGateId) return;
    try {
      await updateCrowdLevel(selectedGateId, newLevel);
      await refresh();
    } catch {
      alert('Failed to update crowd level');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Col: Stadium Heatmap, Forecaster, & Control Panel */}
      <div className="lg:col-span-2 space-y-6">
        <StadiumHeatmap gates={gates} onGateClick={handleGateClick} />

        {/* 30-Min Predictive Forecaster */}
        <CrowdForecaster overloadRisk={overloadRisk} />

        {/* Selected Gate Control Panel (Demo causality loop trigger) */}
        {selectedGate && (
          <div className="glass-card p-4 border-l-2 border-accent-amber animate-fade-in" id="gate-control">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Manage {selectedGate.name}</h3>
              <button onClick={() => setSelectedGateId(null)} className="text-white/40 hover:text-white">✕</button>
            </div>
            
            <p className="text-sm text-white/60 mb-3">
              Trigger crowd level changes to simulate sensor data. This directly affects the fan app and AI routes.
            </p>

            <div className="flex gap-2">
              {['low', 'moderate', 'busy', 'critical'].map((level) => (
                <button
                  key={level}
                  onClick={() => handleLevelChange(level)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                    selectedGate.crowd_level === level
                      ? `bg-white/20 ring-2 ring-white/40`
                      : `bg-white/5 hover:bg-white/10 text-white/70`
                  }`}
                >
                  {level.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI Ops Assistant */}
        <OpsAssistant />
      </div>

      {/* Right Col: Briefing, Scanner & Incidents */}
      <div className="space-y-6">
        {/* QR Scanner Module */}
        <LostFanScanner />

        {/* Ops Briefing */}
        <div className="glass-card p-4 bg-gradient-to-br from-accent-blue/10 to-transparent border-accent-blue/20" id="ops-briefing">
          <h3 className="text-sm font-semibold text-accent-blue mb-2 flex items-center gap-2">
            <span>📡</span> Live Ops Briefing
          </h3>
          <div className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
            {briefing || <span className="text-white/40">Generating briefing...</span>}
          </div>
        </div>

        {/* Incident Feed */}
        <IncidentFeed />
      </div>
    </div>
  );
}
