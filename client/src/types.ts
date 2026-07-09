// ─── Shared types mirroring the server ────────────────────────────────────

export type CrowdLevel = 'low' | 'moderate' | 'busy' | 'critical';
export type UserRole = 'fan' | 'volunteer' | 'organizer';
export type SupportedLanguage = 'en' | 'es' | 'pt' | 'fr' | 'hi' | 'ar';
export type IncidentPriority = 'P1' | 'P2' | 'P3' | 'P4';
export type IncidentStatus = 'open' | 'in_progress' | 'resolved';
export type IncidentType = 'medical' | 'security' | 'maintenance' | 'crowd' | 'lost_child' | 'other';

export interface GateData {
  id: number;
  name: string;
  crowd_level: CrowdLevel;
  coord_x: number;
  coord_y: number;
  accessible: boolean;
}

export interface CrowdResponse {
  gates: GateData[];
}

export interface AskResponse {
  text: string;
  structuredCard?: StructuredCard;
  toolsUsed: string[];
}

export interface StructuredCard {
  type: 'route' | 'food' | 'gate_status' | 'incident' | 'lost_found' | 'crowd_forecast' | 'recommendation';
  title: string;
  data: Record<string, unknown>;
}

export interface TournamentMatch {
  id: number;
  round: string;
  date: string;
  time: string;
  team1: string;
  team2: string;
  score1: number | null;
  score2: number | null;
  venue: string;
  group_name: string | null;
}

export interface TournamentResponse {
  matches: TournamentMatch[];
  nextMatch: TournamentMatch | null;
  venue: string;
  totalMatches: number;
}

export interface Incident {
  id: number;
  type: IncidentType;
  location: string;
  gate_id: number;
  note: string;
  photo_url: string | null;
  priority: IncidentPriority;
  status: IncidentStatus;
  suggested_department: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  structuredCard?: StructuredCard;
  toolsUsed?: string[];
  timestamp: Date;
}

export const LANGUAGE_OPTIONS: Array<{ code: SupportedLanguage; label: string; flag: string }> = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];
