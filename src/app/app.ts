import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatWidgetComponent } from './features/chat-widget/chat-widget';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ChatWidgetComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  title = 'wms-chat-ui';

  private http = inject(HttpClient);

  ngOnInit(): void {
    // Wake Render backend immediately on app load
    this.http
      .get(`${environment.apiUrl}/api/bot/health`, { responseType: 'text' })
      .subscribe({ error: () => {} }); // silent fail OK
  }
}
