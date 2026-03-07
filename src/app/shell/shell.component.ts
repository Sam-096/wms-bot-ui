import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { ToastComponent } from '../shared/components/toast/toast.component';
import { ChatWidgetComponent } from '../features/chat-widget/chat-widget';
import { SidebarComponent } from '../shared/components/sidebar/sidebar';
import { TopbarComponent } from '../shared/components/topbar/topbar';
import { TokenRefreshService } from '../core/services/token-refresh.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, ChatWidgetComponent, SidebarComponent, TopbarComponent, ToastComponent],
  templateUrl: './shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent implements OnInit {
  readonly drawerOpen   = signal(false);
  private readonly router       = inject(Router);
  private readonly tokenRefresh = inject(TokenRefreshService);

  ngOnInit(): void {
    this.tokenRefresh.start();
  }

  isChatRoute(): boolean {
    return this.router.url.startsWith('/chat');
  }
}
