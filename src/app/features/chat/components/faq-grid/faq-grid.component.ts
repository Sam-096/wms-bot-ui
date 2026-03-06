import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaqItem, FaqConfigService } from '../../../../core/services/faq-config.service';
import { AppRole } from '../../../../core/models/auth.model';

// Map AppRole → FaqConfigService role key
const ROLE_MAP: Record<AppRole, string> = {
  MANAGER:    'manager',
  ADMIN:      'admin',
  OPERATOR:   'manager', // fallback to manager
  GATE_STAFF: 'gatekeeper',
  VIEWER:     'driver',
};

@Component({
  selector: 'app-faq-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="px-6 py-4">
      <p class="text-xs text-base-content/40 uppercase tracking-widest font-semibold mb-3">Quick Actions</p>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        @for (faq of faqs; track faq.label; let i = $index) {
          <button
            class="faq-card flex flex-col items-start gap-1.5 p-3 rounded-xl border border-base-300 bg-base-300/40 hover:bg-base-300 hover:border-primary/30 transition-all text-left group"
            [style.animation-delay]="(i * 50) + 'ms'"
            (click)="send.emit(faq.message)"
          >
            <span class="text-xl leading-none">{{ faq.icon }}</span>
            <span class="text-xs font-medium text-base-content leading-snug group-hover:text-primary transition-colors">{{ faq.label }}</span>
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .faq-card {
      animation: faq-fade-in 300ms ease-out both;
    }
    @keyframes faq-fade-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqGridComponent {
  private readonly faqService = inject(FaqConfigService);

  @Output() send = new EventEmitter<string>();

  @Input() set role(r: AppRole | null | undefined) {
    const key = ROLE_MAP[r ?? 'VIEWER'] ?? 'driver';
    this.faqs = this.faqService.getRoleBasedFaqs(key as any);
  }

  faqs: FaqItem[] = this.faqService.getRoleBasedFaqs('manager');
}
