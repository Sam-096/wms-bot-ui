import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ChatSession,
  WorkspaceChatMessage,
  ChatFeedbackRequest,
  ChatMessageAction,
} from '../models/chat-workspace.model';
import { Language } from './bot';
import { AuthService } from './auth.service';

export type ChatStreamEvent =
  | { type: 'token'; text: string }
  | { type: 'access-denied'; text: string; actions: ChatMessageAction[] };

interface RawSseEvent {
  type: string;
  content?: string | null;
  // Defensive aliases: some providers (e.g. Groq via OpenAI SDK) may emit
  // the token text in 'delta' or 'text' instead of the canonical 'content'.
  // The backend should normalise to 'content', but we accept both as a safety net.
  delta?:   string | null;
  text?:    string | null;
  data?: unknown;
  timestamp?: string;
}

/** Strip leaked JSON envelopes and code fences from streamed text. Defense-in-depth.
 *
 *  SAFETY: if the regex would blank a non-empty response (e.g. the backend sent a
 *  ChatEvent DTO string as the content field), we preserve the original text so the
 *  user sees something instead of nothing.
 */
const JSON_ENVELOPE = /\{\s*\\?"type\\?"\s*:[\s\S]*?\}\s*\]?\s*/g;
const CODE_FENCE = /```[a-zA-Z]*\n?[\s\S]*?```\s*/g;
export function sanitizeStreamText(raw: string): string {
  if (!raw) return raw;
  const cleaned = raw.replace(JSON_ENVELOPE, '').replace(CODE_FENCE, '').trim();
  // If sanitisation wiped out everything, return the original — better to show the
  // raw text (possibly with a JSON envelope) than an empty assistant bubble.
  return cleaned || raw.trim();
}

function parseActions(data: unknown): ChatMessageAction[] {
  if (!Array.isArray(data)) return [];
  return data
    .filter((a): a is ChatMessageAction =>
      !!a && typeof (a as ChatMessageAction).label === 'string'
         && typeof (a as ChatMessageAction).route === 'string',
    );
}

/**
 * Stream SSE from backend, emitting typed ChatStreamEvent values.
 *
 * @param signal Optional AbortSignal — chains to the internal AbortController so
 *               the component can cancel the fetch on new-send or on destroy.
 */
function fetchSSE(
  url: string,
  body: unknown,
  token: string | null,
  signal?: AbortSignal,
): Observable<ChatStreamEvent> {
  return new Observable<ChatStreamEvent>((observer) => {
    const ctrl = new AbortController();

    const onExternalAbort = (): void => ctrl.abort();
    signal?.addEventListener('abort', onExternalAbort);

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
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
        // Buffer accumulates raw bytes across read() calls so that events
        // which straddle a network chunk boundary are never silently dropped.
        // SSE uses \n\n as the event separator — we only parse complete blocks.
        let sseBuffer = '';

        const dispatchRaw = (raw: string): boolean => {
          // Returns true when the stream should stop (terminal event received).
          let evt: RawSseEvent;
          try { evt = JSON.parse(raw) as RawSseEvent; } catch { return false; }

          console.debug('[chat-sse]', evt.type, evt);

          switch (evt.type) {
            case 'TOKEN':
            case 'TABLE': {
              // 'content' is canonical. 'delta' / 'text' are fallbacks for
              // providers that haven't normalised to the agreed contract yet.
              const text = evt.content ?? evt.delta ?? evt.text ?? '';
              if (text) observer.next({ type: 'token', text });
              return false;
            }
            case 'INSTANT':
              observer.next({ type: 'token', text: evt.content ?? '' });
              observer.complete();
              return true;
            case 'ACCESS_DENIED':
              observer.next({
                type: 'access-denied',
                text: evt.content ?? '',
                actions: parseActions(evt.data),
              });
              observer.complete();
              return true;
            case 'DONE':
              observer.complete();
              return true;
            case 'ERROR':
              observer.error(new Error(evt.content ?? 'Stream error'));
              return true;
            default:
              console.warn('[chat-sse] unknown event type:', evt.type, evt);
              return false;
          }
        };

        const pump = (): Promise<void> =>
          reader.read().then(({ done, value }) => {
            if (done) {
              // Flush anything left in the buffer (stream closed without \n\n).
              if (sseBuffer.trim()) {
                for (const line of sseBuffer.split('\n')) {
                  if (!line.startsWith('data:')) continue;
                  const raw = line.slice(5).trim();
                  if (!raw) continue;
                  // Stop flushing as soon as a terminal event is hit so we
                  // don't call observer.complete() from two places in sequence.
                  if (dispatchRaw(raw)) break;
                }
              }
              observer.complete();
              return;
            }

            sseBuffer += decoder.decode(value, { stream: true });

            // Split on SSE event boundaries (\n\n).
            // The last element may be an incomplete event — keep it in the buffer.
            const parts = sseBuffer.split('\n\n');
            sseBuffer = parts.pop() ?? '';

            for (const part of parts) {
              let shouldStop = false;
              for (const line of part.split('\n')) {
                if (!line.startsWith('data:')) continue;
                const raw = line.slice(5).trim();
                if (!raw) continue;
                if (dispatchRaw(raw)) { shouldStop = true; break; }
              }
              if (shouldStop) return; // terminal event — stop reading
            }

            return pump();
          });

        pump().catch((e: unknown) => {
          if ((e as Error).name !== 'AbortError') observer.error(e);
        });
      })
      .catch((e: unknown) => {
        if ((e as Error).name !== 'AbortError') observer.error(e);
      });

    return () => {
      signal?.removeEventListener('abort', onExternalAbort);
      ctrl.abort();
    };
  });
}

export interface ChatSendContext {
  warehouseId?: string;
  warehouseName?: string;
  pendingInward?: number;
  pendingOutward?: number;
  lowStockCount?: number;
  openGatePasses?: number;
}

@Injectable({ providedIn: 'root' })
export class ChatWorkspaceService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly base = `${environment.apiUrl}/api/v1/chat`;

  /**
   * Stream a message — emits typed ChatStreamEvent values.
   * @param signal Pass component's AbortController.signal to cancel on new send / destroy.
   */
  sendMessage(
    message: string,
    language: Language,
    sessionId: string,
    signal?: AbortSignal,
    context?: ChatSendContext,
  ): Observable<ChatStreamEvent> {
    const body = {
      message,
      userId: this.auth.getUserId(),
      language,
      sessionId,
      warehouseId:   context?.warehouseId,
      warehouseName: context?.warehouseName,
      context: {
        pendingInward:  context?.pendingInward,
        pendingOutward: context?.pendingOutward,
        lowStockCount:  context?.lowStockCount,
        openGatePasses: context?.openGatePasses,
      },
    };
    return fetchSSE(`${this.base}/stream`, body, this.auth.getToken(), signal);
  }

  getSessions(warehouseId: string): Observable<ChatSession[]> {
    return this.http
      .get<ChatSession[]>(`${this.base}/sessions`, { params: { warehouseId } })
      .pipe(
        map((sessions) =>
          sessions.map((s) => ({
            ...s,
            createdAt:     new Date(s.createdAt),
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
