export type MessageRole = 'user' | 'bot';
export type Language    = 'te' | 'hi' | 'en' | 'ta' | 'kn' | 'mr';
export type UserRole    = 'driver' | 'gatekeeper' | 'manager' | 'lender' | 'admin';

export interface ChatMessage {
  role:       MessageRole;
  text:       string;
  timestamp:  Date;
  isLoading?: boolean;
}
