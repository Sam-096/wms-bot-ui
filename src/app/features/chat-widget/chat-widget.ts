import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  inject,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ChatMessage, Language, UserRole } from '../../core/models/chat-message.model';
import { BotService } from '../../core/services/bot';
import { VoiceInputService } from '../../core/services/voice-input.service';
import { FaqConfigService, FaqItem } from '../../core/services/faq-config.service';
import { SuggestionEngineService } from '../../core/services/suggestion-engine.service';
import { LanguageDetectorService } from '../../core/services/language-detector.service';

const HISTORY_KEY = (warehouse: string) => `wms_chat_history_${warehouse}`;
const MAX_HISTORY = 20;
const FEEDBACK_FADE_MS = 3000;

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './chat-widget.html',
  styleUrls: ['./chat-widget.scss'],
  animations: [
    trigger('fabAnimation', [
      state('open', style({ transform: 'rotate(90deg)' })),
      state('closed', style({ transform: 'rotate(0deg)' })),
      transition('closed <=> open', animate('200ms ease-out')),
    ]),
    trigger('panelAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px) scale(0.95)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0) scale(1)' })),
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(20px) scale(0.95)' })),
      ]),
    ]),
    trigger('messageAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('suggestionAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-8px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
    ]),
  ],
})
export class ChatWidgetComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('messagesEnd') messagesEnd!: ElementRef;
  @ViewChild('inputField') inputField!: ElementRef;

  private readonly botService = inject(BotService);
  private readonly voiceService = inject(VoiceInputService);
  private readonly faqService = inject(FaqConfigService);
  private readonly suggestionEngine = inject(SuggestionEngineService);
  private readonly langDetector = inject(LanguageDetectorService);
  private readonly destroy$ = new Subject<void>();
  private readonly inputChange$ = new Subject<string>();

  // ── UI state ──────────────────────────────────────────────
  isOpen = false;
  isMinimized = false;
  isLoading = false;
  isFocused = false;
  showLangDetectedHint = false;
  detectedLangFlag = '';
  toastMessage = '';
  private toastTimer: any;

  // ── Voice state (from service) ─────────────────────────
  voiceState: 'idle' | 'listening' | 'processing' = 'idle';
  get isListening(): boolean { return this.voiceState === 'listening'; }
  get voiceSupported(): boolean { return this.voiceService.isSupported; }

  // ── Chat data ─────────────────────────────────────────────
  messages: ChatMessage[] = [];
  inputText = '';
  language: Language = 'en';
  role: UserRole = 'manager';
  warehouseName = 'Warehouse';

  // ── FAQs ──────────────────────────────────────────────────
  faqs: FaqItem[] = [];

  private synthesis = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private shouldScroll = false;

  // ── Static config ─────────────────────────────────────────
  readonly languages = [
    { code: 'te', label: 'తెలుగు', flag: '🇮🇳' },
    { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
    { code: 'kn', label: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'mr', label: 'मराठी', flag: '🇮🇳' },
  ];

  readonly roles = [
    { code: 'driver', label: '🚛 Driver' },
    { code: 'gatekeeper', label: '🔒 Gate Staff' },
    { code: 'manager', label: '📦 Manager' },
    { code: 'admin', label: '⚙️ Admin' },
  ];

  readonly welcomeMessages: Record<Language, string> = {
    te: 'నమస్కారం! మీ warehouse assistant నేను. ఏమి సహాయం చేయాలి?',
    hi: 'नमस्ते! मैं आपका warehouse assistant हूँ। कैसे मदद करूँ?',
    en: 'Hello! I am your warehouse assistant. How can I help?',
    ta: 'வணக்கம்! நான் உங்கள் warehouse assistant. எப்படி உதவலாம்?',
    kn: 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ warehouse assistant. ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?',
    mr: 'नमस्कार! मी तुमचा warehouse assistant. कशी मदत करू?',
  };

  ngOnInit(): void {
    this.faqs = this.faqService.getRoleBasedFaqs(this.role);
    this.loadHistory();

    // Debounced language auto-detect on input
    this.inputChange$
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((text) => this.autoDetectLanguage(text));

    // Sync voice state
    this.voiceService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe((s) => (this.voiceState = s));
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Voice ──────────────────────────────────────────────────
  toggleVoice(): void {
    if (!this.voiceSupported) {
      this.showToast('Voice input is not supported in this browser');
      return;
    }
    if (this.isListening) {
      this.voiceService.stopListening();
      return;
    }
    this.voiceService.startListening(this.language).subscribe({
      next: (transcript) => {
        this.inputText = transcript; // paste — do NOT auto-send
        this.voiceState = 'idle';
        setTimeout(() => this.inputField?.nativeElement.focus(), 100);
      },
      error: (err) => {
        if (err === 'PERMISSION_DENIED') {
          this.showToast('Microphone access denied. Please allow mic in browser settings.');
        } else if (err === 'UNSUPPORTED') {
          this.showToast('Voice input is not supported in this browser');
        } else {
          this.showToast('Voice recognition error. Please try again.');
        }
      },
    });
  }

  // ── Send ──────────────────────────────────────────────────
  useFaq(faq: FaqItem): void {
    this.inputText = faq.message;
    this.send();
  }

  useSuggestion(text: string): void {
    this.inputText = text;
    this.send();
  }

  send(): void {
    const text = this.inputText.trim();
    if (!text || this.isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      timestamp: new Date(),
      sessionDate: toDateStr(new Date()),
    };
    this.messages.push(userMsg);
    this.inputText = '';
    this.shouldScroll = true;

    const botMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'bot',
      text: '',
      timestamp: new Date(),
      isLoading: true,
      sessionDate: toDateStr(new Date()),
    };
    this.messages.push(botMsg);
    this.isLoading = true;

    this.botService.sendMessage(text, this.language, this.role, this.warehouseName).subscribe({
      next: (token: string) => {
        botMsg.text += token;
        this.shouldScroll = true;
      },
      error: () => {
        botMsg.text = '⚠️ Connection error. Please try again.';
        botMsg.isLoading = false;
        this.isLoading = false;
        this.saveHistory();
      },
      complete: () => {
        botMsg.isLoading = false;
        botMsg.suggestions = this.suggestionEngine.getSuggestions(botMsg.text, this.language);
        this.isLoading = false;
        this.speakResponse(botMsg.text);
        this.saveHistory();
      },
    });
  }

  // ── Reactions ─────────────────────────────────────────────
  react(msg: ChatMessage, helpful: boolean): void {
    if (msg.reaction !== null && msg.reaction !== undefined) return;
    msg.reaction = helpful ? 'up' : 'down';

    // Fire-and-forget POST — no backend required to succeed
    // POST /api/v1/chat/feedback { messageId, helpful }
    // (wired up once backend endpoint exists)

    setTimeout(() => {
      msg.reactionDone = true;
      setTimeout(() => {
        msg.reaction = null;
        msg.reactionDone = false;
      }, FEEDBACK_FADE_MS);
    }, 600);
  }

  // ── Copy ──────────────────────────────────────────────────
  copyMessage(msg: ChatMessage): void {
    navigator.clipboard.writeText(msg.text).then(() => {
      this.showToast('Copied to clipboard!');
    });
  }

  // ── Language auto-detect ───────────────────────────────────
  onInputChange(text: string): void {
    this.inputChange$.next(text);
  }

  private autoDetectLanguage(text: string): void {
    const detected = this.langDetector.detect(text);
    if (detected && detected !== this.language) {
      this.language = detected;
      this.showLangDetectedHint = true;
      const found = this.languages.find((l) => l.code === detected);
      this.detectedLangFlag = found ? `${found.flag} ${found.label}` : '';
      setTimeout(() => (this.showLangDetectedHint = false), 2500);
    }
  }

  // ── History ───────────────────────────────────────────────
  private loadHistory(): void {
    try {
      const raw = localStorage.getItem(HISTORY_KEY(this.warehouseName));
      if (!raw) return;
      const saved: ChatMessage[] = JSON.parse(raw);
      this.messages = saved.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }));
    } catch {}
  }

  private saveHistory(): void {
    try {
      const toSave = this.messages.slice(-MAX_HISTORY);
      localStorage.setItem(HISTORY_KEY(this.warehouseName), JSON.stringify(toSave));
    } catch {}
  }

  clearHistory(): void {
    this.messages = [];
    localStorage.removeItem(HISTORY_KEY(this.warehouseName));
  }

  // ── TTS ───────────────────────────────────────────────────
  speakResponse(text: string): void {
    if (!this.synthesis) return;
    this.synthesis.cancel();
    const map: Record<Language, string> = {
      te: 'te-IN', hi: 'hi-IN', en: 'en-US',
      ta: 'ta-IN', kn: 'kn-IN', mr: 'mr-IN',
    };
    const u = new SpeechSynthesisUtterance(
      text.replace(/[^\w\s.,!?।\u0C00-\u0C7F\u0900-\u097F]/g, ''),
    );
    u.lang = map[this.language];
    u.rate = 0.9;
    this.synthesis.speak(u);
  }

  // ── Helpers ───────────────────────────────────────────────
  toggleChat(): void {
    this.isOpen = !this.isOpen;
    this.isMinimized = false;
    if (this.isOpen) {
      setTimeout(() => this.inputField?.nativeElement.focus(), 300);
    }
  }

  minimizeChat(): void { this.isMinimized = true; }
  restoreChat(): void  { this.isMinimized = false; }

  onLanguageChange(): void {
    this.faqs = this.faqService.getRoleBasedFaqs(this.role);
  }

  onRoleChange(): void {
    this.faqs = this.faqService.getRoleBasedFaqs(this.role);
  }

  get fabState(): string { return this.isOpen ? 'open' : 'closed'; }

  get welcomeMessage(): string { return this.welcomeMessages[this.language]; }

  isDesktop(): boolean { return window.innerWidth >= 1024; }

  onEnterKey(event: KeyboardEvent): void {
    if (window.innerWidth < 1024) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  showDateSeparator(index: number): boolean {
    if (index === 0) return true;
    const prev = this.messages[index - 1];
    const curr = this.messages[index];
    return prev.sessionDate !== curr.sessionDate;
  }

  formatSessionDate(dateStr: string | undefined): string {
    if (!dateStr) return 'Today';
    const today = toDateStr(new Date());
    const yesterday = toDateStr(new Date(Date.now() - 86400000));
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  }

  trackById = (_: number, msg: ChatMessage) => msg.id;

  private showToast(message: string): void {
    this.toastMessage = message;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toastMessage = ''), 3500);
  }

  private scrollToBottom(): void {
    try {
      this.messagesEnd?.nativeElement.scrollIntoView({ behavior: 'smooth' });
    } catch {}
  }
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}
