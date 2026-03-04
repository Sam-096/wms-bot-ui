import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { BotRequest, } from '../models/bot-request.model';
import { Language, UserRole } from '../models/chat-message.model';

@Injectable({ providedIn: 'root' })
export class BotService {

  private readonly apiUrl = `${environment.apiBaseUrl}/api/bot/chat`;

  // Security: random UUID per session — never user-controlled
  readonly sessionId = crypto.randomUUID();

  sendMessage(
    message:       string,
    language:      Language,
    role:          UserRole,
    warehouseName: string
  ): Observable<string> {

    // Security: sanitize before sending to backend
    const body: BotRequest = {
      message:      this.sanitize(message),
      language,
      role,
      sessionId:    this.sessionId,
      warehouseName
    };

    return new Observable(observer => {
      fetch(this.apiUrl, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify(body)
      })
      .then(async response => {
        if (!response.ok) {
          observer.error(`Error: ${response.status}`);
          return;
        }
        const reader  = response.body!.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) { observer.complete(); break; }
          const chunk = decoder.decode(value);
          chunk.split('\n').forEach(line => {
            if (line.startsWith('data:')) {
              const token = line.replace('data:', '').trim();
              if (token && token !== '[DONE]') {
                observer.next(token);
              }
            }
          });
        }
      })
      .catch(err => observer.error(err));
    });
  }

  // Security: strip HTML tags and JS to prevent XSS
  private sanitize(input: string): string {
    return input
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .trim()
      .substring(0, 500);
  }
}
