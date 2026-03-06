import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { ToastComponent } from '../shared/components/toast/toast.component';
import { ChatWidgetComponent } from '../features/chat-widget/chat-widget';
import { SidebarComponent } from '../shared/components/sidebar/sidebar';
import { TopbarComponent } from '../shared/components/topbar/topbar';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, ChatWidgetComponent, SidebarComponent, TopbarComponent, ToastComponent],
  templateUrl: './shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  readonly drawerOpen = signal(false);
  private readonly router = inject(Router);

  isChatRoute(): boolean {
    return this.router.url.startsWith('/chat');
  }
}
