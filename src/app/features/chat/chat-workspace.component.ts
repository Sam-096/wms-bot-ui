import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
  computed,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { ChatWorkspaceService } from '../../core/services/chat-workspace.service';
import { ToastService } from '../../core/services/toast.service';
import { DashboardSnapshotService } from '../../core/services/dashboard-snapshot.service';
import { SuggestionEngineService } from '../../core/services/suggestion-engine.service';
import { VoiceInputService } from '../../core/services/voice-input.service';
import { FaqGridComponent } from './components/faq-grid/faq-grid.component';

import {
  WorkspaceChatMessage,
  ChatSession,
  ChatSessionGroup,
} from '../../core/models/chat-workspace.model';
import { DashboardSnapshot } from '../../core/models/business.model';
import { Language, UserRole } from '../../core/models/chat-message.model';
import { AppRole } from '../../core/models/auth.model';

function toDateStr(d: Date): string { return d.toISOString().slice(0, 10); }

@Component({
  selector: 'app-chat-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, FaqGridComponent],
  templateUrl: './chat-workspace.component.html',
  styleUrl: './chat-workspace.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatWorkspaceComponent implements OnInit, OnDestroy {
  @ViewChild('messagesEnd') messagesEnd!: ElementRef;
  @ViewChild('inputField')  inputField!: ElementRef;

  private readonly auth        = inject(AuthService);
  private readonly chatSvc     = inject(ChatWorkspaceService);
  private readonly toast       = inject(ToastService);
  private readonly snapSvc     = inject(DashboardSnapshotService);
  private readonly suggestSvc  = inject(SuggestionEngineService);
  private readonly voiceSvc    = inject(VoiceInputService);
  private readonly destroyRef  = inject(DestroyRef);

  // ── Auth context ─────────────────────────────────────────
  readonly user = this.auth.getCurrentUser();
  readonly appRole = computed<AppRole | null>(() => this.user?.role ?? null);
  get warehouseId()   { return this.user?.warehouseId ?? ''; }
  get warehouseName() { return this.user?.warehouseName ?? 'Warehouse'; }

  // ── Language / role for chat API ─────────────────────────
  language: Language = 'en';
  chatRole: UserRole = 'manager';

  // ── Layout state ─────────────────────────────────────────
  readonly leftPanelOpen   = signal(false);
  readonly rightPanelOpen  = signal(true);
  readonly editingTitle    = signal(false);
  readonly editTitleValue  = signal('');

  // ── Sessions ─────────────────────────────────────────────
  readonly sessions        = signal<ChatSession[]>([]);
  readonly activeSessionId = signal<string | null>(null);
  readonly sessionSearch   = signal('');
  readonly loadingSessions = signal(false);

  readonly sessionGroups = computed<ChatSessionGroup[]>(() => {
    const q = this.sessionSearch().toLowerCase();
    const now = new Date();
    const todayStr     = toDateStr(now);
    const yesterdayStr = toDateStr(new Date(now.getTime() - 86400000));
    const weekAgo      = now.getTime() - 7 * 86400000;

    const filtered = this.sessions().filter(
      (s) => !q || s.title.toLowerCase().includes(q) || s.lastMessage?.toLowerCase().includes(q),
    );

    const groups: ChatSessionGroup[] = [
      { label: 'Today',     sessions: [] },
      { label: 'Yesterday', sessions: [] },
      { label: 'This Week', sessions: [] },
      { label: 'Older',     sessions: [] },
    ];

    for (const s of filtered) {
      const d = toDateStr(s.createdAt);
      if (d === todayStr)                         groups[0].sessions.push(s);
      else if (d === yesterdayStr)                groups[1].sessions.push(s);
      else if (s.createdAt.getTime() > weekAgo)  groups[2].sessions.push(s);
      else                                        groups[3].sessions.push(s);
    }
    return groups.filter((g) => g.sessions.length > 0);
  });

  readonly activeSession = computed(() =>
    this.sessions().find((s) => s.id === this.activeSessionId()),
  );

  // ── Messages ─────────────────────────────────────────────
  readonly messages    = signal<WorkspaceChatMessage[]>([]);
  readonly isLoading   = signal(false);
  inputText            = '';
  readonly charCount   = computed(() => this.inputText.length);
  readonly showCount   = computed(() => this.charCount() > 400);
  private shouldScroll = false;

  // ── Streaming SSE controls (LEAK 2 fix) ──────────────────
  private streamAbortCtrl?: AbortController;
  private streamSubscription?: Subscription;

  // ── Reaction animation timers (LEAK 5 fix) ───────────────
  private readonly reactionTimers = new Set<ReturnType<typeof setTimeout>>();

  // ── Voice (FIXED: was `any`) ──────────────────────────────
  voiceState: 'idle' | 'listening' | 'processing' = 'idle';
  voiceDuration = 0;
  private voiceTimer: ReturnType<typeof setInterval> | undefined;
  readonly voiceSupported = this.voiceSvc.isSupported;

  // ── Dashboard snapshot (right panel) ─────────────────────
  readonly snapshot = signal<DashboardSnapshot | null>(null);

  ngOnInit(): void {
    this.loadSessions();

    // Voice state sync — takeUntilDestroyed replaces old Subject+takeUntil
    this.voiceSvc.state$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((s) => { this.voiceState = s; });

    if (this.warehouseId) {
      this.snapSvc.getSnapshot(this.warehouseId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((snap) => this.snapshot.set(snap));

      this.snapSvc.startPolling(this.warehouseId, 60_000)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((snap) => this.snapshot.set(snap));
    }
  }

  ngAfterViewChecked?(): void {
    if (this.shouldScroll) {
      this.messagesEnd?.nativeElement.scrollIntoView({ behavior: 'smooth' });
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    // Abort active SSE fetch (LEAK 2 — prevents orphaned network request)
    this.streamAbortCtrl?.abort();
    this.streamSubscription?.unsubscribe();

    // Clear voice interval (LEAK 4)
    clearInterval(this.voiceTimer);

    // Clear all reaction timers (LEAK 5)
    this.reactionTimers.forEach(clearTimeout);
    this.reactionTimers.clear();

    this.snapSvc.stopPolling();
  }

  // ── Sessions ─────────────────────────────────────────────
  loadSessions(): void {
    if (!this.warehouseId) return;
    this.loadingSessions.set(true);
    this.chatSvc.getSessions(this.warehouseId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.sessions.set(list);
          this.loadingSessions.set(false);
          if (list.length > 0 && !this.activeSessionId()) {
            this.openSession(list[0].id);
          }
        },
        error: () => this.loadingSessions.set(false),
      });
  }

  newSession(): void {
    const id = crypto.randomUUID();
    const session: ChatSession = {
      id,
      title:       'New Chat',
      createdAt:   new Date(),
      warehouseId: this.warehouseId,
    };
    this.sessions.update((list) => [session, ...list]);
    this.activeSessionId.set(id);
    this.messages.set([]);
    this.leftPanelOpen.set(false);
  }

  openSession(id: string): void {
    if (id === this.activeSessionId()) return;
    this.activeSessionId.set(id);
    this.leftPanelOpen.set(false);
    this.chatSvc.getMessages(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((msgs) => {
        this.messages.set(msgs);
        this.shouldScroll = true;
      });
  }

  deleteSession(id: string): void {
    this.chatSvc.deleteSession(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
    this.sessions.update((list) => list.filter((s) => s.id !== id));
    if (this.activeSessionId() === id) {
      this.activeSessionId.set(null);
      this.messages.set([]);
    }
    this.toast.success('Session Deleted', 'Chat session removed.');
  }

  startEditTitle(): void {
    this.editTitleValue.set(this.activeSession()?.title ?? '');
    this.editingTitle.set(true);
  }

  saveTitle(): void {
    const id = this.activeSessionId();
    if (!id) return;
    const title = this.editTitleValue().trim() || 'New Chat';
    this.chatSvc.updateSessionTitle(id, title)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
    this.sessions.update((list) =>
      list.map((s) => (s.id === id ? { ...s, title } : s)),
    );
    this.editingTitle.set(false);
  }

  // ── Send ─────────────────────────────────────────────────
  sendFaq(message: string): void {
    this.inputText = message;
    this.send();
  }

  send(): void {
    const text = this.inputText.trim();
    if (!text || this.isLoading()) return;

    if (!this.activeSessionId()) this.newSession();
    const sessionId = this.activeSessionId()!;

    const userMsg: WorkspaceChatMessage = {
      id:          crypto.randomUUID(),
      sessionId,
      role:        'user',
      text,
      timestamp:   new Date(),
      sessionDate: toDateStr(new Date()),
    };
    this.messages.update((m) => [...m, userMsg]);
    this.inputText    = '';
    this.shouldScroll = true;

    this.sessions.update((list) =>
      list.map((s) =>
        s.id === sessionId
          ? { ...s, lastMessage: text.substring(0, 60), lastMessageAt: new Date() }
          : s,
      ),
    );

    const botMsgId = crypto.randomUUID();
    this.messages.update((m) => [
      ...m,
      {
        id:          botMsgId,
        sessionId,
        role:        'bot' as const,
        text:        '',
        timestamp:   new Date(),
        isLoading:   true,
        sessionDate: toDateStr(new Date()),
      },
    ]);
    this.isLoading.set(true);

    // Abort previous stream before starting a new one (LEAK 2 fix)
    this.streamAbortCtrl?.abort();
    this.streamAbortCtrl = new AbortController();
    this.streamSubscription?.unsubscribe();

    this.streamSubscription = this.chatSvc
      .sendMessage(text, this.language, sessionId, this.streamAbortCtrl.signal)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (token) => {
          // Immutable update — required for OnPush to detect change
          this.messages.update((msgs) => {
            const idx = msgs.findIndex((m) => m.id === botMsgId);
            if (idx === -1) return msgs;
            const updated = { ...msgs[idx], text: msgs[idx].text + token };
            return [...msgs.slice(0, idx), updated, ...msgs.slice(idx + 1)];
          });
          this.shouldScroll = true;
        },
        error: (e: unknown) => {
          this.isLoading.set(false);
          this.messages.update((msgs) => {
            const idx = msgs.findIndex((m) => m.id === botMsgId);
            if (idx === -1) return msgs;
            const updated = {
              ...msgs[idx],
              text:      '⚠️ Connection error. Please try again.',
              isLoading: false,
            };
            return [...msgs.slice(0, idx), updated, ...msgs.slice(idx + 1)];
          });

          const code = (e as { error?: { code?: string } })?.error?.code;
          if (code === 'AI_UNAVAILABLE' || code === 'GROQ_CIRCUIT_OPEN') {
            this.toast.warning('AI Busy', 'Using backup AI. Response may be slower.');
          } else if (code === 'SESSION_NOT_FOUND') {
            this.toast.info('New Session', 'Starting a fresh chat session.');
            this.newSession();
          } else {
            this.toast.error('Chat Error', 'Message failed. Please try again.');
          }
        },
        complete: () => {
          this.isLoading.set(false);

          this.messages.update((msgs) => {
            const idx = msgs.findIndex((m) => m.id === botMsgId);
            if (idx === -1) return msgs;
            const msg = msgs[idx];
            const updated = {
              ...msg,
              isLoading:   false,
              suggestions: this.suggestSvc.getSuggestions(msg.text, this.language),
            };
            return [...msgs.slice(0, idx), updated, ...msgs.slice(idx + 1)];
          });

          // Auto-name session from first user message
          const session = this.activeSession();
          if (session?.title === 'New Chat') {
            const title = text.substring(0, 40);
            this.sessions.update((list) =>
              list.map((s) => (s.id === sessionId ? { ...s, title } : s)),
            );
            this.chatSvc.updateSessionTitle(sessionId, title)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe();
          }
        },
      });
  }

  useSuggestion(text: string): void {
    this.inputText = text;
    this.send();
  }

  react(msg: WorkspaceChatMessage, helpful: boolean): void {
    if (msg.reaction != null) return;
    const msgId = msg.id;

    // Immutable signal update (OnPush safe)
    this.messages.update((msgs) =>
      msgs.map((m) => m.id === msgId ? { ...m, reaction: helpful ? 'up' : 'down' } : m),
    );

    this.chatSvc.sendFeedback({ messageId: msg.id, sessionId: msg.sessionId, helpful })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    // Tracked timers (LEAK 5 fix)
    const t1 = setTimeout(() => {
      this.messages.update((msgs) =>
        msgs.map((m) => m.id === msgId ? { ...m, reactionDone: true } : m),
      );
      this.reactionTimers.delete(t1);

      const t2 = setTimeout(() => {
        this.messages.update((msgs) =>
          msgs.map((m) => m.id === msgId ? { ...m, reaction: null, reactionDone: false } : m),
        );
        this.reactionTimers.delete(t2);
      }, 3000);
      this.reactionTimers.add(t2);
    }, 600);
    this.reactionTimers.add(t1);
  }

  copyMessage(msg: WorkspaceChatMessage): void {
    navigator.clipboard.writeText(msg.text).then(() =>
      this.toast.success('Copied', 'Message copied to clipboard.'),
    );
  }

  // ── Voice ─────────────────────────────────────────────────
  toggleVoice(): void {
    if (!this.voiceSupported) {
      this.toast.info('Not Supported', 'Voice input not supported in this browser.');
      return;
    }
    if (this.voiceState === 'listening') {
      this.voiceSvc.stopListening();
      clearInterval(this.voiceTimer);
      this.voiceTimer    = undefined;
      this.voiceDuration = 0;
      return;
    }
    this.voiceDuration = 0;
    this.voiceTimer = setInterval(() => this.voiceDuration++, 1000);

    this.voiceSvc.startListening(this.language)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (transcript) => {
          clearInterval(this.voiceTimer);
          this.voiceTimer    = undefined;
          this.voiceDuration = 0;
          this.inputText     = transcript;
          setTimeout(() => this.inputField?.nativeElement.focus(), 100);
        },
        error: (err: unknown) => {
          clearInterval(this.voiceTimer);
          this.voiceTimer    = undefined;
          this.voiceDuration = 0;
          if (err === 'PERMISSION_DENIED') {
            this.toast.error('Mic Denied', 'Microphone access denied.');
          }
        },
      });
  }

  // ── Key handler ───────────────────────────────────────────
  onEnterKey(event: KeyboardEvent): void {
    if (window.innerWidth < 1024) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  // ── Date separator helpers ────────────────────────────────
  showDateSeparator(index: number): boolean {
    if (index === 0) return true;
    return this.messages()[index - 1].sessionDate !== this.messages()[index].sessionDate;
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'Today';
    const today = toDateStr(new Date());
    const yest  = toDateStr(new Date(Date.now() - 86400000));
    if (dateStr === today) return 'Today';
    if (dateStr === yest)  return 'Yesterday';
    return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  }

  // ── Snapshot helpers ──────────────────────────────────────
  sendSnapshotQuery(metric: string): void {
    const queries: Record<string, string> = {
      stock:    'Give me the stock health summary',
      vehicles: 'Show vehicles currently inside',
      inward:   'Show pending inward entries',
      outward:  'Show pending outward entries',
      lowstock: 'Show low stock items',
      bonds:    'Show active bonds status',
    };
    const q = queries[metric];
    if (q) { this.inputText = q; this.send(); }
  }

  trackById        = (_: number, msg: WorkspaceChatMessage): string => msg.id;
  trackBySessionId = (_: number, s: ChatSession): string => s.id;

  formatDuration(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
