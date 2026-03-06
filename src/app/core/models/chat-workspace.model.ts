export type WorkspaceResponseType =
  | 'text'
  | 'table'
  | 'chart'
  | 'report'
  | 'action'
  | 'alert'
  | 'list';

export interface WorkspaceChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
  isLoading?: boolean;
  reaction?: 'up' | 'down' | null;
  reactionDone?: boolean;
  suggestions?: string[];
  responseType?: WorkspaceResponseType;
  sessionDate?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  lastMessage?: string;
  lastMessageAt?: Date;
  warehouseId: string;
}

export interface ChatFeedbackRequest {
  messageId: string;
  sessionId: string;
  helpful: boolean;
}

export interface ChatSessionGroup {
  label: 'Today' | 'Yesterday' | 'This Week' | 'Older';
  sessions: ChatSession[];
}
