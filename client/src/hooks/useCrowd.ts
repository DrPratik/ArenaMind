import { useState, useEffect, useCallback } from 'react';
import { getCrowdData } from '../api/client';
import type { GateData } from '../types';

export function useCrowd(pollingInterval = 10000) {
  const [gates, setGates] = useState<GateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyGates, setBusyGates] = useState<GateData[]>([]);
  const [overloadRisk, setOverloadRisk] = useState<any>(null);

  const fetchCrowd = useCallback(async () => {
    try {
      const data = await getCrowdData();
      setGates(data.gates);
      setBusyGates(data.gates.filter((g) => g.crowd_level === 'busy' || g.crowd_level === 'critical'));
      setOverloadRisk(data.overloadRisk || null);
      setLoading(false);
    } catch {
      console.warn('Failed to fetch crowd data');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCrowd();
    const interval = setInterval(fetchCrowd, pollingInterval);
    return () => clearInterval(interval);
  }, [fetchCrowd, pollingInterval]);

  return { gates, loading, busyGates, overloadRisk, refresh: fetchCrowd };
}
