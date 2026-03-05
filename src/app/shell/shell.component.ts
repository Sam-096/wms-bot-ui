import {
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatWidgetComponent } from '../features/chat-widget/chat-widget';
import { SidebarComponent } from '../shared/components/sidebar/sidebar';
import { TopbarComponent } from '../shared/components/topbar/topbar';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, ChatWidgetComponent, SidebarComponent, TopbarComponent],
  templateUrl: './shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  readonly drawerOpen = signal(false);
}
