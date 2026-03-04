import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export type Language = 'te' | 'hi' | 'en' | 'ta' | 'kn' | 'mr';
export type UserRole = 'driver' | 'gatekeeper' | 'manager' | 'admin';

export interface BotRequestPayload {
  message: string;
  language: Language;
  role: UserRole;
  warehouseName: string;
  currentScreen?: string;
  contextData?: string;
}

export interface QuickAction {
  label: string;
  route: string;
  icon: string;
}

export interface ParsedBotResponse {
  text: string;
  actions: QuickAction[];
}

@Injectable({ providedIn: 'root' })
export class BotService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/bot`;

  sendMessage(
    message: string,
    language: Language,
    role: UserRole,
    warehouseName: string,
    currentScreen?: string,
    contextData?: string,
  ): Observable<string> {
    return this.http
      .post(
        `${this.apiUrl}/chat`,
        { message, language, role, warehouseName, currentScreen, contextData },
        { responseType: 'text' },
      )
      .pipe(
        map((raw: string) =>
          raw
            .split('\n')
            .filter((line) => line.startsWith('data:'))
            .map((line) => line.substring(5).trim())
            .filter((token) => token.length > 0 && token !== '[DONE]')
            .join(''),
        ),
      );
  }

  chat(payload: BotRequestPayload): Observable<string> {
    return this.http.post(`${this.apiUrl}/chat`, payload, { responseType: 'text' }).pipe(
      map((raw: string) =>
        raw
          .split('\n')
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.substring(5).trim())
          .filter((token) => token.length > 0 && token !== '[DONE]')
          .join(''),
      ),
    );
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
