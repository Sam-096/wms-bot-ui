export type Language = 'te' | 'hi' | 'en' | 'ta' | 'kn' | 'mr';
export type UserRole = 'driver' | 'gatekeeper' | 'manager' | 'admin';

export interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
  isLoading?: boolean;
}
