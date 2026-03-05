import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private readonly http = inject(HttpClient);

  ngOnInit(): void {
    // Wake Render backend on app load (silent fail OK)
    this.http
      .get(`${environment.apiUrl}/api/bot/health`, { responseType: 'text' })
      .subscribe({ error: () => {} });
  }
}
