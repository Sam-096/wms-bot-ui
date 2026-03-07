import { Injectable } from '@angular/core';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export interface NavAction {
  label: string;
  route: string;
}

export type MessageView =
  | { type: 'text';    html: string }
  | { type: 'actions'; message: string; actions: NavAction[] }
  | { type: 'denied';  message: string; actions: NavAction[] }
  | { type: 'data';    message: string; data: unknown };

@Injectable({ providedIn: 'root' })
export class ChatMessageParserService {

  parse(raw: string): MessageView {
    // 1. Try direct JSON parse
    let json = this.tryParseJson(raw);

    // 2. Try extract ```json ... ``` fenced block
    if (!json) {
      const fence = raw.match(/```json\s*([\s\S]*?)```/);
      if (fence) json = this.tryParseJson(fence[1]);
    }

    if (json) {
      if (json.type === 'navigation_suggestion') {
        return { type: 'actions', message: json.message ?? '', actions: json.actions ?? [] };
      }
      if (json.type === 'access_denied') {
        return { type: 'denied',  message: json.message ?? '', actions: json.actions ?? [] };
      }
      if (json.type === 'data') {
        return { type: 'data', message: json.message ?? '', data: json.data };
      }
    }

    // 3. Fix concatenated camelCase words + render as markdown
    const fixed = raw.replace(/([a-z])([A-Z])/g, '$1 $2');
    const md    = marked.parse(fixed) as string;
    return { type: 'text', html: DOMPurify.sanitize(md) };
  }

  sanitize(html: string): string {
    return DOMPurify.sanitize(html);
  }

  private tryParseJson(text: string): Record<string, unknown> | null {
    try {
      const parsed = JSON.parse(text.trim());
      return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : null;
    } catch {
      return null;
    }
  }
}
