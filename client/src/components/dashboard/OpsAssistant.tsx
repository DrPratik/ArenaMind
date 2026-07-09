import React, { useState } from 'react';
import { getOrganizerQuery } from '../../api/client';

export default function OpsAssistant() {
  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState<{ text: string; reasoning?: string } | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsQuerying(true);
    try {
      const res = await getOrganizerQuery(query);
      setQueryResult(res);
    } catch {
      setQueryResult({ text: 'Error executing query.' });
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="glass-card p-4 space-y-4" id="ops-assistant">
      <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
        <span>🧠</span> Ops Assistant
      </h3>

      <form onSubmit={handleQuery} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask for analysis (e.g., 'What is the risk of overload at Gate 8?')"
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
        />
        <button
          type="submit"
          disabled={isQuerying || !query.trim()}
          className="bg-accent-blue hover:bg-accent-blue/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isQuerying ? 'Analyzing...' : 'Ask'}
        </button>
      </form>

      {queryResult && (
        <div className="bg-navy-800/50 p-4 rounded-lg border border-white/5 space-y-2 text-sm text-white/80 animate-fade-in">
          <p>{queryResult.text}</p>
          {queryResult.reasoning && (
            <div className="mt-2 pt-2 border-t border-white/5">
              <span className="text-xs text-accent-cyan block mb-1">Reasoning:</span>
              <p className="text-xs text-white/60">{queryResult.reasoning}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
