export interface Ensemble {
  id: string;
  name: string;
  order: number;
  color?: string;            // hex used for calendar chips; falls back to a palette by order
  defaultLocation?: string;
  defaultStartTime?: string; // "HH:MM" (24h)
  defaultEndTime?: string;
  meetingDays?: number[];    // 0=Sun … 6=Sat — informational recurring pattern
}

export interface Student {
  id: string;
  name: string;
  ensembleIds: string[];
  instrument: string;
  section?: string;
  grade?: string;
  status: 'Active' | 'Inactive' | 'Graduated';
  // Contact info moves to the auth-only `contacts` collection in Phase 4.
  email?: string;
  parentEmail?: string;
}

export type EventType = 'Rehearsal' | 'Concert' | 'Sectional' | 'Event';
export type EventStatus = 'Scheduled' | 'Completed' | 'Cancelled';

/**
 * Unified calendar item — rehearsals, concerts, sectionals, and other events
 * all share one shape so they render on a single calendar. A concert can span
 * several ensembles, so ensembleIds is an array.
 */
export interface CalendarEvent {
  id: string;
  type: EventType;
  ensembleIds: string[];
  date: string;           // YYYY-MM-DD
  startTime?: string;     // "HH:MM" (24h)
  endTime?: string;       // "HH:MM" (24h)
  location?: string;
  title?: string;         // primarily for concerts / one-off events
  repertoire?: string;
  status: EventStatus;
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  ensembleId: string;
  date: string; // YYYY-MM-DD
  status: 'Absent' | 'Late' | 'Excused';
  reason?: string;
  notes?: string;
}

export interface ProgressNote {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  content: string;
  category?: string;
}

export type AttendanceStatus = 'Absent' | 'Late' | 'Excused';
export type Tab = 'roll' | 'roster' | 'schedule' | 'notes';
