import { Injectable } from '@angular/core';
import { Language } from '../models/chat-message.model';

const SCRIPT_RANGES: { lang: Language; from: number; to: number }[] = [
  { lang: 'te', from: 0x0c00, to: 0x0c7f }, // Telugu
  { lang: 'hi', from: 0x0900, to: 0x097f }, // Devanagari (Hindi/Marathi)
  { lang: 'ta', from: 0x0b80, to: 0x0bff }, // Tamil
  { lang: 'kn', from: 0x0c80, to: 0x0cff }, // Kannada
];

@Injectable({ providedIn: 'root' })
export class LanguageDetectorService {
  /**
   * Returns detected Language or null if text is Latin/ambiguous or < 3 chars.
   */
  detect(text: string): Language | null {
    if (!text || text.length < 3) return null;

    for (const char of text) {
      const cp = char.codePointAt(0) ?? 0;
      for (const { lang, from, to } of SCRIPT_RANGES) {
        if (cp >= from && cp <= to) return lang;
      }
    }
    return null;
  }
}
