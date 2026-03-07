import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { AuthService } from './core/services/auth.service';

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
  private readonly auth = inject(AuthService);

  ngOnInit(): void {
    // On every page reload: clear expired session immediately before any route guard runs.
    if (this.auth.isTokenExpired()) {
      this.auth.logout();
    }

    // Wake Render backend on app load (silent fail OK)
    this.http
      .get(`${environment.apiUrl}/api/bot/health`, { responseType: 'text' })
      .subscribe({ error: () => {} });
  }
}
