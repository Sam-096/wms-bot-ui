import { Language, UserRole } from './chat-message.model';

export interface BotRequest {
  message:       string;
  language:      Language;
  role:          UserRole;
  sessionId:     string;
  warehouseName: string;
  currentScreen?: string;   
  contextData?:   string; 
}
