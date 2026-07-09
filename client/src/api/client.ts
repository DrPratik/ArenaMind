import type { AskResponse, CrowdResponse, TournamentResponse, Incident, UserRole, SupportedLanguage } from '../types';

const BASE_URL = '/api';

export async function askArenaMind(
  role: UserRole,
  message: string,
  language: SupportedLanguage,
  sessionId: string,
  imageBase64?: string,
): Promise<AskResponse> {
  const res = await fetch(`${BASE_URL}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, message, language, sessionId, imageBase64 }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getCrowdData(): Promise<CrowdResponse> {
  const res = await fetch(`${BASE_URL}/crowd`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function updateCrowdLevel(gateId: number, crowdLevel: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/crowd/admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gate_id: gateId, crowd_level: crowdLevel }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
}

export async function getTournamentData(): Promise<TournamentResponse> {
  const res = await fetch(`${BASE_URL}/tournament`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getIncidents(filters?: Record<string, string>): Promise<{ incidents: Incident[] }> {
  const params = new URLSearchParams(filters ?? {});
  const res = await fetch(`${BASE_URL}/incident?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function createIncident(data: {
  note: string;
  location: string;
  gate_id: number;
  sessionId: string;
  type?: string;
  photo_url?: string;
}): Promise<{ incident: Incident }> {
  const res = await fetch(`${BASE_URL}/incident`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function scanTicket(qrPayload: string) {
  const res = await fetch(`${BASE_URL}/ticket/scan/${encodeURIComponent(qrPayload)}`);
  if (!res.ok) throw new Error('Ticket not found');
  const data = await res.json();
  return data.ticket;
}

export async function updateIncidentStatus(id: number, status: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/incident/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
}

export async function getOrganizerQuery(query: string): Promise<{
  text: string;
  recommendation: string;
  reasoning: string;
  data: Record<string, unknown>;
}> {
  const res = await fetch(`${BASE_URL}/organizer/query?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getOrganizerBriefing(): Promise<{ briefing: string }> {
  const res = await fetch(`${BASE_URL}/organizer/briefing`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
