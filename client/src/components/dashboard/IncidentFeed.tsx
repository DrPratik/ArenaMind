import { useState, useEffect, useCallback } from 'react';
import { getIncidents, updateIncidentStatus } from '../../api/client';
import type { Incident, IncidentPriority, IncidentStatus } from '../../types';

export default function IncidentFeed() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filterPriority, setFilterPriority] = useState<IncidentPriority | ''>('');
  const [filterStatus, setFilterStatus] = useState<IncidentStatus | ''>('');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const fetchIncidents = useCallback(async () => {
    try {
      const filters: Record<string, string> = {};
      if (filterPriority) filters.priority = filterPriority;
      if (filterStatus) filters.status = filterStatus;
      const data = await getIncidents(filters);
      setIncidents(data.incidents);
    } catch {
      console.warn('Failed to fetch incidents');
    }
  }, [filterPriority, filterStatus]);

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 15000);
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  const handleStatusChange = async (id: number, newStatus: IncidentStatus) => {
    await updateIncidentStatus(id, newStatus);
    fetchIncidents();
    if (selectedIncident?.id === id) {
      setSelectedIncident({ ...selectedIncident, status: newStatus });
    }
  };

  const priorityColors: Record<string, string> = {
    P1: 'bg-red-500/15 text-red-400 border-red-500/30',
    P2: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    P3: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    P4: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  };

  const statusIcons: Record<string, string> = {
    open: '🔴',
    in_progress: '🟡',
    resolved: '🟢',
  };

  const typeIcons: Record<string, string> = {
    medical: '🏥',
    security: '🛡️',
    maintenance: '🔧',
    crowd: '👥',
    lost_child: '👶',
    other: '📋',
  };

  return (
    <div className="space-y-3" id="incident-feed">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
          <span>📋</span> Incidents
          <span className="text-xs px-2 py-0.5 rounded-full bg-accent-blue/10 text-accent-blue">{incidents.length}</span>
        </h3>
        <button onClick={fetchIncidents} className="text-xs text-accent-blue/60 hover:text-accent-blue transition-colors">Refresh</button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as IncidentPriority | '')}
          className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white"
          aria-label="Filter by priority"
        >
          <option value="">All priorities</option>
          <option value="P1">P1 — Critical</option>
          <option value="P2">P2 — High</option>
          <option value="P3">P3 — Medium</option>
          <option value="P4">P4 — Low</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as IncidentStatus | '')}
          className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Incident List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {incidents.map((inc) => (
          <button
            key={inc.id}
            onClick={() => setSelectedIncident(inc)}
            className={`w-full text-left glass-card p-3 cursor-pointer transition-all ${selectedIncident?.id === inc.id ? 'ring-1 ring-accent-blue/50' : ''}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span>{typeIcons[inc.type] ?? '📋'}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{inc.note.slice(0, 60)}{inc.note.length > 60 ? '...' : ''}</p>
                  <p className="text-xs text-white/40">{inc.location} • {new Date(inc.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${priorityColors[inc.priority]}`}>
                  {inc.priority}
                </span>
                <span className="text-[10px] text-white/40">
                  {statusIcons[inc.status]} {inc.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </button>
        ))}
        {incidents.length === 0 && (
          <p className="text-sm text-white/30 text-center py-4">No incidents matching filters</p>
        )}
      </div>

      {/* Detail View */}
      {selectedIncident && (
        <div className="glass-card p-4 border-l-2 border-accent-blue animate-fade-in" id="incident-detail">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-white">Incident #{selectedIncident.id}</h4>
            <button
              onClick={() => setSelectedIncident(null)}
              className="text-white/40 hover:text-white text-sm"
              aria-label="Close detail"
            >✕</button>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/50">Type</span>
              <span className="text-white">{typeIcons[selectedIncident.type]} {selectedIncident.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Priority</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${priorityColors[selectedIncident.priority]}`}>{selectedIncident.priority}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Location</span>
              <span className="text-white">{selectedIncident.location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Department</span>
              <span className="text-accent-cyan text-xs">{selectedIncident.suggested_department}</span>
            </div>
            <div>
              <span className="text-white/50 text-xs">Notes:</span>
              <p className="text-white/80 mt-1">{selectedIncident.note}</p>
            </div>

            {/* Status Update */}
            <div className="pt-2 border-t border-white/5">
              <label className="text-xs text-white/50">Update Status:</label>
              <div className="flex gap-2 mt-1">
                {(['open', 'in_progress', 'resolved'] as IncidentStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(selectedIncident.id, s)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                      selectedIncident.status === s
                        ? 'bg-accent-blue text-white'
                        : 'bg-white/5 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    {statusIcons[s]} {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
