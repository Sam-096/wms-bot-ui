import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChatSession, WorkspaceChatMessage, ChatFeedbackRequest } from '../models/chat-workspace.model';
import { Language, UserRole } from '../models/chat-message.model';

@Injectable({ providedIn: 'root' })
export class ChatWorkspaceService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/chat`;

  /** Send a message and get back the full response text (non-streaming). */
  sendMessage(
    message: string,
    language: Language,
    role: UserRole,
    warehouseName: string,
    sessionId: string,
  ): Observable<string> {
    return this.http
      .post(
        `${environment.apiUrl}/api/bot/chat`,
        { message, language, role, warehouseName, sessionId },
        { responseType: 'text' },
      )
      .pipe(
        map((raw: string) =>
          raw
            .split('\n')
            .filter((l) => l.startsWith('data:'))
            .map((l) => l.substring(5).trim())
            .filter((t) => t.length > 0 && t !== '[DONE]')
            .join(''),
        ),
        catchError(() => of('⚠️ Connection error. Please try again.')),
      );
  }

  getSessions(warehouseId: string): Observable<ChatSession[]> {
    return this.http
      .get<ChatSession[]>(`${this.base}/sessions`, { params: { warehouseId } })
      .pipe(
        map((sessions) =>
          sessions.map((s) => ({
            ...s,
            createdAt: new Date(s.createdAt),
            lastMessageAt: s.lastMessageAt ? new Date(s.lastMessageAt) : undefined,
          })),
        ),
        catchError(() => of([])),
      );
  }

  getMessages(sessionId: string): Observable<WorkspaceChatMessage[]> {
    return this.http
      .get<WorkspaceChatMessage[]>(`${this.base}/sessions/${sessionId}/messages`)
      .pipe(
        map((msgs) =>
          msgs.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })),
        ),
        catchError(() => of([])),
      );
  }

  updateSessionTitle(sessionId: string, title: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/sessions/${sessionId}`, { title });
  }

  deleteSession(sessionId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/sessions/${sessionId}`);
  }

  sendFeedback(req: ChatFeedbackRequest): Observable<void> {
    return this.http
      .post<void>(`${this.base}/feedback`, req)
      .pipe(catchError(() => of(undefined as void)));
  }
}
