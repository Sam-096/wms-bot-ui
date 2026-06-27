import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  ChatWorkspaceService,
  sanitizeStreamText,
} from '../../core/services/chat-workspace.service';
import { VoiceInputService } from '../../core/services/voice-input.service';
import { Language } from '../../core/models/chat-message.model';

declare const gsap: any;

type DemoStatus = 'idle' | 'listening' | 'transcribing' | 'streaming' | 'done' | 'error';
type ErrorKey   = '' | 'generic' | 'mic-denied' | 'no-speech' | 'browser';

interface LangOption {
  code: Language;
  label: string;
  native: string;
}

interface UiStrings {
  title: string;
  subtitle: string;
  micReady: string;
  micListening: string;
  micProcessing: string;
  micResponding: string;
  micDone: string;
  micError: string;
  transcriptLabel: string;
  replyLabel: string;
  transcriptEmpty: string;
  replyEmpty: string;
  promptsLabel: string;
  prompts: ReadonlyArray<{ label: string; text: string }>;
  statusLabels: Record<DemoStatus, string>;
  errorGeneric: string;
  errorMicDenied: string;
  errorNoSpeech: string;
  errorBrowser: string;
}

// All backend query texts stay in English for reliable API responses.
// Only display labels are localised.
const UI_STRINGS: Record<Language, UiStrings> = {

  te: {
    title: 'మీ AI సహాయకుడు',
    subtitle: 'అడగండి — వేర్‌హౌస్ జవాబులు తక్షణమే పొందండి',
    micReady:       'మాట్లాడటానికి నొక్కండి',
    micListening:   'వింటున్నాను… మీ ప్రశ్న చెప్పండి',
    micProcessing:  'ప్రాసెస్ అవుతోంది…',
    micResponding:  'జవాబు వస్తోంది…',
    micDone:        'మళ్ళీ మాట్లాడటానికి నొక్కండి',
    micError:       'మళ్ళీ ప్రయత్నించడానికి నొక్కండి',
    transcriptLabel: 'మీరు చెప్పింది',
    replyLabel:      'AI జవాబు',
    transcriptEmpty: 'మీరు మాట్లాడిన తర్వాత మీ మాటలు ఇక్కడ కనిపిస్తాయి…',
    replyEmpty:      'AI జవాబు ఇస్తున్నది…',
    promptsLabel: 'ప్రయత్నించండి:',
    prompts: [
      { label: 'స్టాక్ నిల్వ స్థితి',      text: 'What is the stock health status?' },
      { label: 'వేర్‌హౌస్‌లో వాహనాలు', text: 'How many vehicles are inside the warehouse?' },
      { label: 'పెండింగ్ ఎంట్రీలు',      text: 'Show me pending inward entries' },
    ],
    statusLabels: {
      idle:        'సిద్ధంగా ఉంది',
      listening:   'వింటున్నాను',
      transcribing:'ప్రాసెస్ అవుతోంది',
      streaming:   'సమాధానమిస్తోంది',
      done:        'పూర్తయింది',
      error:       'మళ్ళీ ప్రయత్నించండి',
    },
    errorGeneric:   'ఇప్పుడు ప్రాసెస్ చేయలేకపోయాము. దయచేసి మళ్ళీ ప్రయత్నించండి.',
    errorMicDenied: 'మైక్రోఫోన్ అనుమతి నిరాకరించబడింది. బ్రౌజర్ సెట్టింగ్‌లలో అనుమతించండి.',
    errorNoSpeech:  'మాట వినబడలేదు. దయచేసి మళ్ళీ ప్రయత్నించండి.',
    errorBrowser:   'ఈ బ్రౌజర్‌లో వాయిస్ ఇన్‌పుట్ సపోర్ట్ లేదు. Chrome వాడండి.',
  },

  en: {
    title: 'Your AI Assistant',
    subtitle: 'Ask your question — get instant warehouse answers',
    micReady:       'Tap to speak your question',
    micListening:   'Listening… speak your question',
    micProcessing:  'Processing…',
    micResponding:  'Generating reply…',
    micDone:        'Tap the mic to ask another question',
    micError:       'Tap the mic to try again',
    transcriptLabel: 'Your words',
    replyLabel:      'Assistant reply',
    transcriptEmpty: 'Your spoken words will appear here…',
    replyEmpty:      'The assistant\'s reply will appear here…',
    promptsLabel: 'Try:',
    prompts: [
      { label: 'Stock health',    text: 'What is the stock health status?' },
      { label: 'Vehicles inside', text: 'How many vehicles are inside the warehouse?' },
      { label: 'Pending entries', text: 'Show me pending inward entries' },
    ],
    statusLabels: {
      idle:        'Ready',
      listening:   'Listening',
      transcribing:'Processing',
      streaming:   'Responding',
      done:        'Done',
      error:       'Try again',
    },
    errorGeneric:   "We couldn't process that just now. Please try again.",
    errorMicDenied: 'Microphone access was denied. Please allow it in your browser settings.',
    errorNoSpeech:  'No speech detected. Please try again.',
    errorBrowser:   'Voice input is not supported in this browser. Please use Chrome or Edge.',
  },

  hi: {
    title: 'आपका AI सहायक',
    subtitle: 'हिंदी में पूछें — गोदाम की जानकारी तुरंत पाएं',
    micReady:       'बोलने के लिए टैप करें',
    micListening:   'सुन रहा हूं… अपना सवाल बोलें',
    micProcessing:  'प्रोसेस हो रहा है…',
    micResponding:  'जवाब आ रहा है…',
    micDone:        'दोबारा बोलने के लिए टैप करें',
    micError:       'दोबारा कोशिश करने के लिए टैप करें',
    transcriptLabel: 'आपने कहा',
    replyLabel:      'सहायक का जवाब',
    transcriptEmpty: 'आपके बोले हुए शब्द यहाँ दिखेंगे…',
    replyEmpty:      'सहायक का जवाब यहाँ आएगा…',
    promptsLabel: 'आज़माएं:',
    prompts: [
      { label: 'स्टॉक स्थिति',  text: 'What is the stock health status?' },
      { label: 'वाहन अंदर',     text: 'How many vehicles are inside the warehouse?' },
      { label: 'पेंडिंग एंट्री', text: 'Show me pending inward entries' },
    ],
    statusLabels: {
      idle:        'तैयार',
      listening:   'सुन रहा हूं',
      transcribing:'प्रोसेस हो रहा है',
      streaming:   'जवाब दे रहा है',
      done:        'पूरा हुआ',
      error:       'दोबारा कोशिश करें',
    },
    errorGeneric:   'अभी प्रोसेस नहीं हो पाया। कृपया दोबारा कोशिश करें।',
    errorMicDenied: 'माइक्रोफोन की अनुमति नहीं दी। ब्राउजर सेटिंग में अनुमति दें।',
    errorNoSpeech:  'कोई आवाज़ नहीं मिली। कृपया दोबारा कोशिश करें।',
    errorBrowser:   'इस ब्राउजर में वॉइस इनपुट नहीं है। Chrome उपयोग करें।',
  },

  ta: {
    title: 'உங்கள் AI உதவியாளர்',
    subtitle: 'தமிழில் கேளுங்கள் — கிடங்கு விடைகள் உடனே',
    micReady:       'பேசுவதற்கு தட்டுங்கள்',
    micListening:   'கேட்கிறேன்… உங்கள் கேள்வியைச் சொல்லுங்கள்',
    micProcessing:  'செயல்படுத்துகிறது…',
    micResponding:  'பதில் வருகிறது…',
    micDone:        'மீண்டும் பேசுவதற்கு தட்டுங்கள்',
    micError:       'மீண்டும் முயற்சிக்க தட்டுங்கள்',
    transcriptLabel: 'நீங்கள் சொன்னது',
    replyLabel:      'உதவியாளர் பதில்',
    transcriptEmpty: 'உங்கள் வார்த்தைகள் இங்கே தோன்றும்…',
    replyEmpty:      'பதில் இங்கே வரும்…',
    promptsLabel: 'முயற்சிக்கவும்:',
    prompts: [
      { label: 'பொருள் நிலை',   text: 'What is the stock health status?' },
      { label: 'வாகனங்கள்',    text: 'How many vehicles are inside the warehouse?' },
      { label: 'நிலுவை பதிவுகள்', text: 'Show me pending inward entries' },
    ],
    statusLabels: {
      idle:        'தயார்',
      listening:   'கேட்கிறேன்',
      transcribing:'செயல்படுத்துகிறது',
      streaming:   'பதிலளிக்கிறது',
      done:        'முடிந்தது',
      error:       'மீண்டும் முயற்சிக்கவும்',
    },
    errorGeneric:   'இப்போது செயல்படுத்த முடியவில்லை. மீண்டும் முயற்சிக்கவும்.',
    errorMicDenied: 'மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டது. உலாவி அமைப்புகளில் அனுமதிக்கவும்.',
    errorNoSpeech:  'பேச்சு கண்டறியப்படவில்லை. மீண்டும் முயற்சிக்கவும்.',
    errorBrowser:   'இந்த உலாவியில் குரல் உள்ளீடு இல்லை. Chrome பயன்படுத்தவும்.',
  },

  kn: {
    title: 'ನಿಮ್ಮ AI ಸಹಾಯಕ',
    subtitle: 'ಕನ್ನಡದಲ್ಲಿ ಕೇಳಿ — ಗೋದಾಮಿನ ಉತ್ತರ ತಕ್ಷಣ ಪಡೆಯಿರಿ',
    micReady:       'ಮಾತನಾಡಲು ಟ್ಯಾಪ್ ಮಾಡಿ',
    micListening:   'ಕೇಳುತ್ತಿದ್ದೇನೆ… ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಹೇಳಿ',
    micProcessing:  'ಪ್ರಕ್ರಿಯೆಯಲ್ಲಿದೆ…',
    micResponding:  'ಉತ್ತರ ಬರುತ್ತಿದೆ…',
    micDone:        'ಮತ್ತೆ ಮಾತನಾಡಲು ಟ್ಯಾಪ್ ಮಾಡಿ',
    micError:       'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಲು ಟ್ಯಾಪ್ ಮಾಡಿ',
    transcriptLabel: 'ನೀವು ಹೇಳಿದ್ದು',
    replyLabel:      'ಸಹಾಯಕನ ಉತ್ತರ',
    transcriptEmpty: 'ನಿಮ್ಮ ಮಾತುಗಳು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ…',
    replyEmpty:      'ಉತ್ತರ ಇಲ್ಲಿ ಬರುತ್ತದೆ…',
    promptsLabel: 'ಪ್ರಯತ್ನಿಸಿ:',
    prompts: [
      { label: 'ಸ್ಟಾಕ್ ಸ್ಥಿತಿ',   text: 'What is the stock health status?' },
      { label: 'ವಾಹನಗಳು',        text: 'How many vehicles are inside the warehouse?' },
      { label: 'ಬಾಕಿ ಎಂಟ್ರಿಗಳು', text: 'Show me pending inward entries' },
    ],
    statusLabels: {
      idle:        'ಸಿದ್ಧ',
      listening:   'ಕೇಳುತ್ತಿದ್ದೇನೆ',
      transcribing:'ಪ್ರಕ್ರಿಯಿಸುತ್ತಿದೆ',
      streaming:   'ಉತ್ತರಿಸುತ್ತಿದೆ',
      done:        'ಮುಗಿದಿದೆ',
      error:       'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ',
    },
    errorGeneric:   'ಈಗ ಪ್ರಕ್ರಿಯಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
    errorMicDenied: 'ಮೈಕ್ರೋಫೋನ್ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ಬ್ರೌಸರ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳಲ್ಲಿ ಅನುಮತಿಸಿ.',
    errorNoSpeech:  'ಧ್ವನಿ ಕಂಡುಬಂದಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
    errorBrowser:   'ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಇನ್‌ಪುಟ್ ಬೆಂಬಲಿಸುವುದಿಲ್ಲ. Chrome ಬಳಸಿ.',
  },

  mr: {
    title: 'तुमचा AI सहाय्यक',
    subtitle: 'मराठीत विचारा — गोदामाची माहिती लगेच मिळवा',
    micReady:       'बोलण्यासाठी टॅप करा',
    micListening:   'ऐकतो आहे… तुमचा प्रश्न सांगा',
    micProcessing:  'प्रक्रिया होत आहे…',
    micResponding:  'उत्तर येत आहे…',
    micDone:        'पुन्हा बोलण्यासाठी टॅप करा',
    micError:       'पुन्हा प्रयत्न करण्यासाठी टॅप करा',
    transcriptLabel: 'तुम्ही म्हणालेले',
    replyLabel:      'सहाय्यकाचे उत्तर',
    transcriptEmpty: 'तुमचे शब्द इथे दिसतील…',
    replyEmpty:      'उत्तर इथे येईल…',
    promptsLabel: 'वापरून पाहा:',
    prompts: [
      { label: 'स्टॉक स्थिती',    text: 'What is the stock health status?' },
      { label: 'वाहने आत',        text: 'How many vehicles are inside the warehouse?' },
      { label: 'प्रलंबित नोंदी', text: 'Show me pending inward entries' },
    ],
    statusLabels: {
      idle:        'तयार',
      listening:   'ऐकतो आहे',
      transcribing:'प्रक्रिया होत आहे',
      streaming:   'उत्तर देत आहे',
      done:        'पूर्ण झाले',
      error:       'पुन्हा प्रयत्न करा',
    },
    errorGeneric:   'आत्ता प्रक्रिया होऊ शकली नाही. कृपया पुन्हा प्रयत्न करा.',
    errorMicDenied: 'मायक्रोफोनची परवानगी नाकारली. ब्राउझर सेटिंग्जमध्ये परवानगी द्या.',
    errorNoSpeech:  'आवाज आढळला नाही. कृपया पुन्हा प्रयत्न करा.',
    errorBrowser:   'या ब्राउझरमध्ये व्हॉइस इनपुट नाही. Chrome वापरा.',
  },

  ne: {
    title: 'तपाईंको AI सहायक',
    subtitle: 'नेपालीमा सोध्नुहोस् — गोदामको जवाफ तुरुन्तै',
    micReady:       'बोल्नका लागि थिच्नुहोस्',
    micListening:   'सुनिरहेको छु… आफ्नो प्रश्न भन्नुहोस्',
    micProcessing:  'प्रक्रियागत छ…',
    micResponding:  'जवाफ आउँदैछ…',
    micDone:        'फेरि बोल्नका लागि थिच्नुहोस्',
    micError:       'फेरि प्रयास गर्न थिच्नुहोस्',
    transcriptLabel: 'तपाईंले भन्नुभयो',
    replyLabel:      'AI जवाफ',
    transcriptEmpty: 'तपाईंका शब्दहरू यहाँ देखिनेछन्…',
    replyEmpty:      'जवाफ यहाँ आउनेछ…',
    promptsLabel: 'प्रयास गर्नुहोस्:',
    prompts: [
      { label: 'स्टक अवस्था',     text: 'What is the stock health status?' },
      { label: 'सवारी भित्र',    text: 'How many vehicles are inside the warehouse?' },
      { label: 'पेन्डिङ प्रविष्टि', text: 'Show me pending inward entries' },
    ],
    statusLabels: {
      idle:        'तयार',
      listening:   'सुनिरहेको छु',
      transcribing:'प्रक्रियागत छ',
      streaming:   'जवाफ दिँदैछ',
      done:        'सकियो',
      error:       'फेरि प्रयास गर्नुहोस्',
    },
    errorGeneric:   'अहिले प्रक्रिया गर्न सकिएन। कृपया फेरि प्रयास गर्नुहोस्।',
    errorMicDenied: 'माइक्रोफोन अनुमति अस्वीकार गरियो। ब्राउजर सेटिङमा अनुमति दिनुहोस्।',
    errorNoSpeech:  'कुनै आवाज भेटिएन। कृपया फेरि प्रयास गर्नुहोस्।',
    errorBrowser:   'यो ब्राउजरमा भ्वाइस इनपुट छैन। Chrome प्रयोग गर्नुहोस्।',
  },
};

@Component({
  selector: 'app-voice-demo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './voice-demo.component.html',
  styleUrl: './voice-demo.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoiceDemoComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly chatSvc    = inject(ChatWorkspaceService);
  private readonly voiceSvc   = inject(VoiceInputService);
  private readonly router     = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // ── Core state ───────────────────────────────────────────────
  readonly language      = signal<Language>('te');
  readonly status        = signal<DemoStatus>('idle');
  readonly voiceDuration = signal(0);
  readonly transcript    = signal('');
  readonly aiResponse    = signal('');
  // Storing a key rather than a string means the displayed message
  // automatically re-localises when the user switches language.
  readonly errorKey      = signal<ErrorKey>('');

  readonly voiceSupported = this.voiceSvc.isSupported;

  // ── Internals ────────────────────────────────────────────────
  private voiceTimer?: ReturnType<typeof setInterval>;
  private streamAbortCtrl?: AbortController;
  private streamSubscription?: Subscription;
  private readonly demoSessionId = crypto.randomUUID();

  // ── Language metadata ────────────────────────────────────────
  readonly langs: LangOption[] = [
    { code: 'te', label: 'Telugu',  native: 'తెలుగు'  },
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi',   native: 'हिंदी'   },
    { code: 'ta', label: 'Tamil',   native: 'தமிழ்'   },
    { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ'   },
    { code: 'mr', label: 'Marathi', native: 'मराठी'   },
    { code: 'ne', label: 'Nepali',  native: 'नेपाली'  },
  ];

  // ── Computed ─────────────────────────────────────────────────
  readonly selectedLang = computed(() =>
    this.langs.find((l) => l.code === this.language()) ?? this.langs[0],
  );

  readonly uiStrings = computed<UiStrings>(() => UI_STRINGS[this.language()]);

  readonly quickPrompts = computed(() => this.uiStrings().prompts);

  readonly micHint = computed(() => {
    const s = this.uiStrings();
    switch (this.status()) {
      case 'listening':    return s.micListening;
      case 'transcribing': return s.micProcessing;
      case 'streaming':    return s.micResponding;
      case 'done':         return s.micDone;
      case 'error':        return s.micError;
      default:             return s.micReady;
    }
  });

  readonly errorMsg = computed(() => {
    const k = this.errorKey();
    if (!k) return '';
    const s = this.uiStrings();
    switch (k) {
      case 'generic':    return s.errorGeneric;
      case 'mic-denied': return s.errorMicDenied;
      case 'no-speech':  return s.errorNoSpeech;
      case 'browser':    return s.errorBrowser;
      default:           return s.errorGeneric;
    }
  });

  readonly transcriptWordCount = computed(() =>
    this.transcript().trim() ? this.transcript().trim().split(/\s+/).length : 0,
  );

  readonly responseWordCount = computed(() =>
    this.aiResponse().trim() ? this.aiResponse().trim().split(/\s+/).length : 0,
  );

  readonly isBusy = computed(() => {
    const s = this.status();
    return s === 'transcribing' || s === 'streaming';
  });

  // ── Lifecycle ────────────────────────────────────────────────
  ngOnInit(): void {
    this.voiceSvc.state$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((vState) => {
        if (vState === 'idle' && this.status() === 'listening') {
          clearInterval(this.voiceTimer);
          this.voiceTimer = undefined;
          this.voiceDuration.set(0);
          this.status.set('idle');
        }
      });
  }

  ngAfterViewInit(): void {
    this.initAnimations();
  }

  ngOnDestroy(): void {
    this.streamAbortCtrl?.abort();
    this.streamSubscription?.unsubscribe();
    clearInterval(this.voiceTimer);
    this.voiceSvc.stopListening();
  }

  // ── GSAP intro ───────────────────────────────────────────────
  private initAnimations(): void {
    if (typeof gsap === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    try {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out', clearProps: 'all' } });
      tl.from('.demo-gsap-header',     { y: -16, opacity: 0, duration: 0.4  })
        .from('.demo-gsap-welcome',    { y: 28,  opacity: 0, duration: 0.55 }, '-=0.25')
        .from('.demo-gsap-card',       { y: 22,  opacity: 0, duration: 0.5  }, '-=0.32')
        .from('.demo-gsap-mic',        { scale: 0.65, opacity: 0, duration: 0.48,
                                         ease: 'back.out(1.7)' },              '-=0.22')
        .from('.demo-gsap-chip',       { y: 10, opacity: 0, stagger: 0.07,
                                         duration: 0.32 },                     '-=0.16')
        .from('.demo-gsap-transcript', { y: 18, opacity: 0, duration: 0.42  }, '-=0.26')
        .from('.demo-gsap-response',   { y: 18, opacity: 0, duration: 0.42  }, '-=0.36');
    } catch { /* GSAP not critical */ }
  }

  // ── Controls ─────────────────────────────────────────────────
  setLanguage(val: string): void {
    this.language.set(val as Language);
  }

  toggleVoice(): void {
    if (this.status() === 'listening') {
      this.voiceSvc.stopListening();
      clearInterval(this.voiceTimer);
      this.voiceTimer = undefined;
      this.voiceDuration.set(0);
      this.status.set('idle');
      return;
    }

    if (!this.voiceSupported) {
      this.status.set('error');
      this.errorKey.set('browser');
      return;
    }

    this.streamAbortCtrl?.abort();
    this.streamSubscription?.unsubscribe();
    this.transcript.set('');
    this.aiResponse.set('');
    this.errorKey.set('');
    this.voiceDuration.set(0);
    this.status.set('listening');
    this.voiceTimer = setInterval(() => this.voiceDuration.update((v) => v + 1), 1000);

    this.voiceSvc.startListening(this.language())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (t) => {
          clearInterval(this.voiceTimer);
          this.voiceTimer = undefined;
          this.voiceDuration.set(0);
          this.transcript.set(t);
          this.sendToAI(t);
        },
        error: (err: unknown) => {
          clearInterval(this.voiceTimer);
          this.voiceTimer = undefined;
          this.voiceDuration.set(0);
          this.status.set('error');
          this.errorKey.set(
            err === 'PERMISSION_DENIED' ? 'mic-denied' :
            err === 'no-speech'         ? 'no-speech'  : 'generic',
          );
        },
      });
  }

  sendQuickPrompt(text: string): void {
    if (this.isBusy()) return;
    this.streamAbortCtrl?.abort();
    this.transcript.set(text);
    this.aiResponse.set('');
    this.errorKey.set('');
    this.sendToAI(text);
  }

  private sendToAI(text: string): void {
    this.status.set('streaming');
    this.aiResponse.set('');
    this.streamAbortCtrl = new AbortController();

    this.streamSubscription = this.chatSvc
      .sendMessage(text, this.language(), this.demoSessionId, this.streamAbortCtrl.signal)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:     (evt) => { this.aiResponse.update((r) => r + evt.text); },
        error:    ()    => { this.status.set('error'); this.errorKey.set('generic'); },
        complete: ()    => {
          this.aiResponse.update((r) => sanitizeStreamText(r));
          this.status.set('done');
        },
      });
  }

  reset(): void {
    this.streamAbortCtrl?.abort();
    this.streamSubscription?.unsubscribe();
    this.voiceSvc.stopListening();
    clearInterval(this.voiceTimer);
    this.voiceTimer = undefined;
    this.transcript.set('');
    this.aiResponse.set('');
    this.errorKey.set('');
    this.voiceDuration.set(0);
    this.status.set('idle');
  }

  navigateBack(): void {
    void this.router.navigate(['/']);
  }

  formatDuration(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
