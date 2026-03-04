import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatWidgetComponent } from './features/chat-widget/chat-widget';


@Component({
  selector:  'app-root',
  standalone: true,
  imports:   [RouterOutlet, ChatWidgetComponent],
  templateUrl: './app.html',
  styleUrl:    './app.scss'
})
export class App {
  title = 'wms-chat-ui';
}
