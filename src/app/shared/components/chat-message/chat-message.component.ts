import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { JsonPipe } from '@angular/common';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MessageView, NavAction } from '../../../core/services/chat-message-parser.service';

@Component({
  selector: 'app-chat-message',
  standalone: true,
  imports: [JsonPipe],
  templateUrl: './chat-message.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatMessageComponent {
  readonly view = input.required<MessageView>();

  private readonly router    = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);

  get safeHtml(): SafeHtml {
    const v = this.view();
    return v.type === 'text'
      ? this.sanitizer.bypassSecurityTrustHtml(v.html)
      : '';
  }

  get message(): string {
    const v = this.view();
    return v.type !== 'text' ? v.message : '';
  }

  get actions(): NavAction[] {
    const v = this.view();
    return v.type === 'actions' || v.type === 'denied' ? v.actions : [];
  }

  get data(): unknown {
    const v = this.view();
    return v.type === 'data' ? v.data : null;
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }
}
