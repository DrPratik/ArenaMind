// ─── Enums ───────────────────────────────────────────────────────────────────

export type CrowdLevel = 'low' | 'moderate' | 'busy' | 'critical';
export type RouteMode = 'standard' | 'wheelchair' | 'fastest' | 'less_crowded';
export type IncidentPriority = 'P1' | 'P2' | 'P3' | 'P4';
export type IncidentStatus = 'open' | 'in_progress' | 'resolved';
export type IncidentType = 'medical' | 'security' | 'maintenance' | 'crowd' | 'lost_child' | 'other';
export type AmenityType = 'restroom' | 'food' | 'medical' | 'prayer_room' | 'nursing_room' | 'info_desk';
export type UserRole = 'fan' | 'volunteer' | 'organizer';

export type SupportedLanguage = 'en' | 'es' | 'pt' | 'fr' | 'hi' | 'ar';

// ─── Database Row Types ──────────────────────────────────────────────────────

export interface Gate {
  id: number;
  name: string;
  section_range: string;
  current_crowd_level: CrowdLevel;
  accessible: boolean;
  coord_x: number;
  coord_y: number;
}

export interface Section {
  id: number;
  gate_id: number;
  name: string;
  seat_range: string;
  accessible: boolean;
}

export interface Amenity {
  id: number;
  type: AmenityType;
  name: string;
  gate_id: number;
  coord_x: number;
  coord_y: number;
  accessible: boolean;
}

export interface FoodStall {
  id: number;
  name: string;
  amenity_id: number;
  cuisine_tags: string; // comma-separated: "veg,halal"
  current_queue_minutes: number;
  gate_id: number;
}

export interface Route {
  id: number;
  from_type: string; // 'gate' | 'amenity'
  from_id: number;
  to_type: string;
  to_id: number;
  mode: RouteMode;
  steps_json: string; // JSON string of RouteStep[]
  estimated_minutes: number;
  distance_meters: number;
}

export interface RouteStep {
  instruction: string;
  landmark: string;
  distance_meters: number;
}

export interface CrowdLogEntry {
  id: number;
  gate_id: number;
  crowd_level: CrowdLevel;
  timestamp: string; // ISO 8601
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

export interface LostFoundItem {
  id: number;
  description: string;
  location_found: string;
  gate_id: number;
  timestamp: string;
  matched: boolean;
}

export interface Persona {
  id: number;
  name: string;
  role: UserRole;
  language: SupportedLanguage;
  accessibility_needs: string;
  description: string;
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

// ─── API Types ───────────────────────────────────────────────────────────────

export interface AskRequest {
  role: UserRole;
  message: string;
  language: SupportedLanguage;
  imageBase64?: string;
  sessionId: string;
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

export interface IncidentRequest {
  note: string;
  location: string;
  gate_id: number;
  photo_url?: string;
  sessionId: string;
}

export interface CrowdData {
  gates: Array<{
    id: number;
    name: string;
    crowd_level: CrowdLevel;
    coord_x: number;
    coord_y: number;
    accessible: boolean;
  }>;
}

export interface AdminCrowdUpdate {
  gate_id: number;
  crowd_level: CrowdLevel;
}

export interface OrganizerQueryResponse {
  text: string;
  recommendation: string;
  reasoning: string;
  data: Record<string, unknown>;
}

// ─── Tool Call Types ─────────────────────────────────────────────────────────

export interface ToolCallResult {
  toolName: string;
  result: Record<string, unknown>;
}

export interface ResolvedFacts {
  tools: ToolCallResult[];
  rawData: Record<string, unknown>;
}
