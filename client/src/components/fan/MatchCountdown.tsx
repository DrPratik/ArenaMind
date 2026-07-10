import { useTournament } from '../../hooks/useTournament';
import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function MatchCountdown() {
  const { nextMatch, loading } = useTournament();
  const { t } = useLanguage();
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!nextMatch) return;

    function updateCountdown() {
      const matchDate = new Date(`${nextMatch!.date}T${nextMatch!.time || '20:00'}:00`);
      const now = new Date();
      const diff = matchDate.getTime() - now.getTime();

      if (diff <= -120 * 60 * 1000) {
        setCountdown(t.matchFinished);
        return;
      }

      if (diff <= 0) {
        setCountdown(t.liveNow);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setCountdown(`${days}d ${hours}h ${mins}m`);
      } else {
        setCountdown(`${hours}h ${mins}m ${secs}s`);
      }
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextMatch]);

  if (loading) {
    return (
      <div className="glass-card p-5 animate-fade-in">
        <div className="skeleton h-6 w-48 mb-3" />
        <div className="skeleton h-10 w-64 mb-2" />
        <div className="skeleton h-4 w-32" />
      </div>
    );
  }

  if (!nextMatch) return null;

  const isLive = countdown === 'LIVE NOW';

  return (
    <div className="glass-card p-5 animate-fade-in overflow-hidden relative" id="match-countdown">
      {/* Gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-blue via-accent-cyan to-accent-emerald" />

      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-accent-cyan uppercase tracking-wider">{nextMatch.round}</span>
        {nextMatch.group_name && (
          <span className="text-xs text-white/40">• {nextMatch.group_name}</span>
        )}
      </div>

      {/* Teams */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <div className="text-center flex-1">
          <div className="text-xl sm:text-2xl font-bold text-white">{nextMatch.team1}</div>
        </div>
        <div className="flex flex-col items-center">
          {nextMatch.score1 !== null && nextMatch.score2 !== null ? (
            <div className="text-2xl font-black text-white">
              {nextMatch.score1} — {nextMatch.score2}
            </div>
          ) : (
            <div className="text-lg font-bold text-white/40">VS</div>
          )}
        </div>
        <div className="text-center flex-1">
          <div className="text-xl sm:text-2xl font-bold text-white">{nextMatch.team2}</div>
        </div>
      </div>

      {/* Countdown */}
      <div className="flex items-center justify-center gap-2">
        {isLive ? (
          <span className="flex items-center gap-2 text-sm font-bold text-accent-crimson">
            <span className="inline-block w-2 h-2 rounded-full bg-accent-crimson animate-pulse" />
            LIVE NOW
          </span>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/40">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-sm text-white/60">{nextMatch.date} at {nextMatch.time || '20:00'}</span>
            <span className="text-sm font-bold text-accent-cyan ml-1">• {countdown}</span>
          </>
        )}
      </div>

      <div className="mt-2 text-center">
        <span className="text-xs text-white/30">📍 New York New Jersey Stadium</span>
      </div>
    </div>
  );
}
