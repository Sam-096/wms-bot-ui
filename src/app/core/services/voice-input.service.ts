import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Language } from '../models/chat-message.model';

export type VoiceState = 'idle' | 'listening' | 'processing';

const LANG_MAP: Record<Language, string> = {
  en: 'en-IN',
  te: 'te-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  kn: 'kn-IN',
  mr: 'mr-IN',
};

@Injectable({ providedIn: 'root' })
export class VoiceInputService {
  readonly isListening$ = new BehaviorSubject<boolean>(false);
  readonly state$ = new BehaviorSubject<VoiceState>('idle');

  readonly isSupported: boolean =
    typeof window !== 'undefined' &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  private recognition: any = null;

  /** Returns an Observable that emits the transcript string once, then completes. */
  startListening(language: Language): Observable<string> {
    return new Observable<string>((observer) => {
      if (!this.isSupported) {
        observer.error('UNSUPPORTED');
        return;
      }

      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SR();
      this.recognition.lang = LANG_MAP[language] ?? 'en-IN';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening$.next(true);
        this.state$.next('listening');
      };

      this.recognition.onresult = (event: any) => {
        this.state$.next('processing');
        const transcript: string = event.results[0][0].transcript;
        observer.next(transcript);
        observer.complete();
      };

      this.recognition.onerror = (event: any) => {
        this.reset();
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          observer.error('PERMISSION_DENIED');
        } else {
          observer.error(event.error);
        }
      };

      this.recognition.onend = () => {
        this.reset();
      };

      this.recognition.start();
    });
  }

  stopListening(): void {
    try {
      this.recognition?.stop();
    } catch {}
    this.reset();
  }

  private reset(): void {
    this.isListening$.next(false);
    this.state$.next('idle');
  }
}
