import { Component, OnInit, ViewChild,
         ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { MatIconModule }     from '@angular/material/icon';
import { MatButtonModule }   from '@angular/material/button';
import { MatTooltipModule }  from '@angular/material/tooltip';
import { trigger, transition, style,
         animate, state } from '@angular/animations';

import { ChatMessage, Language, UserRole }
  from '../../core/models/chat-message.model';
import { BotService } from '../../core/services/bot';
import { MatIconRegistry } from "@angular/material/icon";
import { DomSanitizer } from "@angular/platform-browser";

@Component({
  selector:    'app-chat-widget',
  standalone:  true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './chat-widget.html',
  styleUrls:   ['./chat-widget.scss'],
  animations: [
    // 1. FAB Button Animation
    trigger('fabAnimation', [
      state('active', style({ transform: 'rotate(90deg)' })),
      state('inactive', style({ transform: 'rotate(0deg)' })),
      transition('inactive <=> active', animate('200ms ease-out'))
    ]),
    
    // 2. Chat Panel Entrance/Exit
    trigger('panelAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px) scale(0.95)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(20px) scale(0.95)' }))
      ])
    ]),

    // 3. Individual Message Entrance
    trigger('messageAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class ChatWidgetComponent implements OnInit, AfterViewChecked {

  @ViewChild('messagesEnd') messagesEnd!: ElementRef;
  @ViewChild('inputField')  inputField!:  ElementRef;

  // ── UI state ──────────────────────────────────────────────
  isOpen       = false;
  isListening  = false;
  isLoading    = false;
  isFocused    = false;

  // ── Chat data ─────────────────────────────────────────────
  messages:       ChatMessage[] = [];
  inputText       = '';
  language:       Language = 'te';
  role:           UserRole = 'manager';
  warehouseName             = 'Warehouse';

  private recognition:  any;
  private synthesis     = window.speechSynthesis;
  private shouldScroll  = false;

  // ── Static config ─────────────────────────────────────────
  readonly languages = [
    { code: 'te', label: 'తెలుగు' },
    { code: 'hi', label: 'हिंदी'   },
    { code: 'en', label: 'English' },
    { code: 'ta', label: 'தமிழ்'   },
    { code: 'kn', label: 'ಕನ್ನಡ'   },
    { code: 'mr', label: 'मराठी'   }
  ];

  readonly roles = [
    { code: 'driver',     label: '🚛 Driver'  },
    { code: 'gatekeeper', label: '🔒 Gate'    },
    { code: 'manager',    label: '📦 Manager' },
    { code: 'admin',      label: '⚙️ Admin'   }
  ];

  readonly suggestions: Record<Language, string[]> = {
    te: ['Bond status చెప్పు', 'Gate pass ఎలా?', 'Stock ఎంత ఉంది?'],
    hi: ['Bond status बताओ',   'Gate pass कैसे?', 'Stock कितना है?'],
    en: ['Check bond status',  'How to gate pass?', 'Stock available?'],
    ta: ['Bond status சொல்',   'Gate pass எப்படி?', 'Stock எவ்வளவு?'],
    kn: ['Bond status ಹೇಳಿ',   'Gate pass ಹೇಗೆ?',   'Stock ಎಷ್ಟು?'  ],
    mr: ['Bond status सांगा',  'Gate pass कसा?',     'Stock किती?'   ]
  };

  readonly welcomeMessages: Record<Language, string> = {
    te: 'నమస్కారం! మీ warehouse assistant నేను. ఏమి సహాయం చేయాలి?',
    hi: 'नमस्ते! मैं आपका warehouse assistant हूँ। कैसे मदद करूँ?',
    en: 'Hello! I am your warehouse assistant. How can I help?',
    ta: 'வணக்கம்! நான் உங்கள் warehouse assistant. எப்படி உதவலாம்?',
    kn: 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ warehouse assistant. ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?',
    mr: 'नमस्कार! मी तुमचा warehouse assistant. कशी मदत करू?'
  };

  constructor(private botService: BotService, private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer) {
      this.matIconRegistry.addSvgIcon(
      "godown_ai", // Your custom name
      this.domSanitizer.bypassSecurityTrustResourceUrl("public/ai-hub-svgrepo-com.svg")
    );
    }

  ngOnInit(): void  { this.initVoice(); }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  // ── Voice ─────────────────────────────────────────────────
  private initVoice(): void {
    const SR = (window as any).SpeechRecognition
            || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    this.recognition = new SR();
    this.recognition.continuous     = false;
    this.recognition.interimResults = false;

    this.recognition.onresult = (e: any) => {
      this.inputText   = e.results[0][0].transcript;
      this.isListening = false;
      this.send();
    };
    this.recognition.onerror = () => { this.isListening = false; };
    this.recognition.onend   = () => { this.isListening = false; };
  }

  toggleVoice(): void {
    if (!this.recognition) {
      alert('Voice not supported. Please use Chrome.');
      return;
    }
    if (this.isListening) {
      this.recognition.stop();
    } else {
      const map: Record<Language, string> = {
        te: 'te-IN', hi: 'hi-IN', en: 'en-US',
        ta: 'ta-IN', kn: 'kn-IN', mr: 'mr-IN'
      };
      this.recognition.lang = map[this.language];
      this.recognition.start();
      this.isListening = true;
    }
  }

  // ── Send ──────────────────────────────────────────────────
  useSuggestion(text: string): void {
    this.inputText = text;
    this.send();
  }

  send(): void {
    const text = this.inputText.trim();
    if (!text || this.isLoading) return;

    this.messages.push({ role: 'user', text, timestamp: new Date() });
    this.inputText    = '';
    this.shouldScroll = true;

    const botMsg: ChatMessage = {
      role: 'bot', text: '', timestamp: new Date(), isLoading: true
    };
    this.messages.push(botMsg);
    this.isLoading = true;

    this.botService.sendMessage(
      text, this.language, this.role, this.warehouseName
    ).subscribe({
      next: (token: string) => {
        botMsg.text      += token;
        this.shouldScroll = true;
      },
      error: () => {
        botMsg.text      = '⚠️ Connection error. Please try again.';
        botMsg.isLoading = false;
        this.isLoading   = false;
      },
      complete: () => {
        botMsg.isLoading = false;
        this.isLoading   = false;
        this.speakResponse(botMsg.text);
      }
    });
  }

  // ── TTS ───────────────────────────────────────────────────
  speakResponse(text: string): void {
    if (!this.synthesis) return;
    this.synthesis.cancel();
    const map: Record<Language, string> = {
      te: 'te-IN', hi: 'hi-IN', en: 'en-US',
      ta: 'ta-IN', kn: 'kn-IN', mr: 'mr-IN'
    };
    const u  = new SpeechSynthesisUtterance(
      text.replace(/[^\w\s.,!?।\u0C00-\u0C7F\u0900-\u097F]/g, '')
    );
    u.lang   = map[this.language];
    u.rate   = 0.9;
    this.synthesis.speak(u);
  }

  // ── Helpers ───────────────────────────────────────────────
  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() =>
        this.inputField?.nativeElement.focus(), 300);
    }
  }

  onLanguageChange(): void { this.messages = []; }

  get currentSuggestions(): string[] {
    return this.suggestions[this.language] ?? [];
  }

  get welcomeMessage(): string {
    return this.welcomeMessages[this.language];
  }

  get fabState(): string {
    return this.isOpen ? 'open' : 'closed';
  }

  trackByIndex = (i: number) => i;

  private scrollToBottom(): void {
    try {
      this.messagesEnd?.nativeElement
        .scrollIntoView({ behavior: 'smooth' });
    } catch {}
  }
}
