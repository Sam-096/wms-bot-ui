import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChatSession, WorkspaceChatMessage, ChatFeedbackRequest } from '../models/chat-workspace.model';
import { Language } from './bot';
import { AuthService } from './auth.service';

/** Stream SSE from backend, emitting individual TOKEN content strings. */
function fetchSSE(
  url: string,
  body: unknown,
  token: string | null,
): Observable<string> {
  return new Observable<string>((observer) => {
    const ctrl = new AbortController();

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })
      .then((res) => {
        if (!res.ok) {
          observer.error(new Error(`HTTP ${res.status}`));
          return;
        }

        const reader  = res.body!.getReader();
        const decoder = new TextDecoder();

        const pump = (): Promise<void> =>
          reader.read().then(({ done, value }) => {
            if (done) { observer.complete(); return; }

            const lines = decoder.decode(value, { stream: true }).split('\n');

            for (const line of lines) {
              if (!line.startsWith('data:')) continue;
              const raw = line.slice(5).trim();
              if (!raw) continue;

              try {
                const evt = JSON.parse(raw) as { type: string; content?: string | null };
                if (evt.type === 'TOKEN' && evt.content) {
                  observer.next(evt.content);
                } else if (evt.type === 'INSTANT') {
                  observer.next(evt.content ?? '');
                  observer.complete();
                  return;
                } else if (evt.type === 'DONE') {
                  observer.complete();
                  return;
                }
              } catch { /* skip malformed */ }
            }

            return pump();
          });

        pump().catch((e) => {
          if ((e as Error).name !== 'AbortError') observer.error(e);
        });
      })
      .catch((e) => {
        if ((e as Error).name !== 'AbortError') observer.error(e);
      });

    return () => ctrl.abort();
  });
}

@Injectable({ providedIn: 'root' })
export class ChatWorkspaceService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly base = `${environment.apiUrl}/api/v1/chat`;

  /** Stream a message — emits individual TOKEN content strings. */
  sendMessage(
    message: string,
    language: Language,
    sessionId: string,
  ): Observable<string> {
    return fetchSSE(
      `${this.base}/stream`,
      { message, userId: this.auth.getUserId(), language, sessionId },
      this.auth.getToken(),
    ).pipe(
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
        map((msgs) => msgs.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }))),
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
