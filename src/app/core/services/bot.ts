import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
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

function assembleSSE(raw: string): string {
  return raw
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.substring(5).trim())
    .filter((token) => token.length > 0 && token !== '[DONE]')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

@Injectable({ providedIn: 'root' })
export class BotService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly chatUrl = `${environment.apiUrl}/api/v1/chat`;

  sendMessage(
    message: string,
    language: Language = 'en',
    _role?: UserRole,
    _warehouseName?: string,
  ): Observable<string> {
    const userId = this.auth.getUserId();
    return this.http
      .post(this.chatUrl, { message, userId, language }, { responseType: 'text' })
      .pipe(map(assembleSSE));
  }

  chat(payload: { message: string; language?: Language; [k: string]: unknown }): Observable<string> {
    const userId = this.auth.getUserId();
    return this.http
      .post(this.chatUrl, { ...payload, userId }, { responseType: 'text' })
      .pipe(map(assembleSSE));
  }

  parseResponse(raw: string): ParsedBotResponse {
    const actionRegex = /```action\s*([\s\S]*?)```/g;
    const actions: QuickAction[] = [];
    let text = raw;
    let match;
    while ((match = actionRegex.exec(raw)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed.actions) actions.push(...parsed.actions);
        text = text.replace(match[0], '').trim();
      } catch {
        /* skip */
      }
    }
    return { text, actions };
  }
}
