export type Language = 'te' | 'hi' | 'en' | 'ta' | 'kn' | 'mr';
export type UserRole = 'driver' | 'gatekeeper' | 'manager' | 'admin';
export type Reaction = 'up' | 'down' | null;

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
  isLoading?: boolean;
  reaction?: Reaction;
  reactionDone?: boolean; // "Thanks!" shown, fading out
  suggestions?: string[]; // contextual follow-ups after bot reply
  sessionDate?: string;   // YYYY-MM-DD for date separator logic
}
