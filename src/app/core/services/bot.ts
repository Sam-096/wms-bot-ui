import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BotRequestPayload {
  message: string;
  language: string;
  role: string;
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
  private readonly apiUrl = `${environment.apiUrl}/api/bot`; // ← uses env

  chat(payload: BotRequestPayload): Observable<string> {
    return this.http.post(`${this.apiUrl}/chat`, payload, { responseType: 'text' });
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
        /* skip malformed JSON */
      }
    }
    return { text, actions };
  }
}
