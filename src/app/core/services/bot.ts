import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export type Language = 'te' | 'hi' | 'en' | 'ta' | 'kn' | 'mr';
export type UserRole  = 'driver' | 'gatekeeper' | 'manager' | 'admin';

export interface QuickAction {
  label: string;
  route: string;
  icon: string;
}

export interface ParsedBotResponse {
  text: string;
  actions: QuickAction[];
}

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
            if (done) {
              observer.complete();
              return;
            }

            const lines = decoder.decode(value, { stream: true }).split('\n');

            for (const line of lines) {
              if (!line.startsWith('data:')) continue;
              const raw = line.slice(5).trim();
              if (!raw) continue;

              try {
                const evt = JSON.parse(raw) as {
                  type: string;
                  content?: string | null;
                };

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
              } catch {
                /* skip malformed lines */
              }
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

    // Teardown: cancel the stream when the Observable is unsubscribed
    return () => ctrl.abort();
  });
}

@Injectable({ providedIn: 'root' })
export class BotService {
  private readonly auth    = inject(AuthService);
  private readonly streamUrl = `${environment.apiUrl}/api/v1/chat/stream`;

  /**
   * Send a message and stream back individual TOKEN content strings.
   * Components accumulate them: `msg.text += token`.
   *
   * @param _role / @param _warehouseName — kept for backward compatibility;
   * the backend now derives role from the JWT claim directly.
   */
  sendMessage(
    message: string,
    language: Language = 'en',
    _role?: UserRole,
    _warehouseName?: string,
  ): Observable<string> {
    return fetchSSE(
      this.streamUrl,
      { message, userId: this.auth.getUserId(), language },
      this.auth.getToken(),
    );
  }

  /** Low-level chat with arbitrary extra payload fields. */
  chat(payload: { message: string; language?: Language; [k: string]: unknown }): Observable<string> {
    return fetchSSE(
      this.streamUrl,
      { ...payload, userId: this.auth.getUserId() },
      this.auth.getToken(),
    );
  }

  /** Parse legacy ```action ... ``` code-fenced blocks from bot text. */
  parseResponse(raw: string): ParsedBotResponse {
    const actionRegex = /```action\s*([\s\S]*?)```/g;
    const actions: QuickAction[] = [];
    let text = raw;
    let match;
    while ((match = actionRegex.exec(raw)) !== null) {
      try {
        const parsed = JSON.parse(match[1]) as { actions?: QuickAction[] };
        if (parsed.actions) actions.push(...parsed.actions);
        text = text.replace(match[0], '').trim();
      } catch {
        /* skip */
      }
    }
    return { text, actions };
  }
}
