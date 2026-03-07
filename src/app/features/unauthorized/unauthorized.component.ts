import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-screen flex-col items-center justify-center gap-6 bg-base-100 p-6 text-center">
      <div class="text-8xl font-black text-error/20 select-none">403</div>

      <div class="space-y-2">
        <h1 class="text-2xl font-bold text-base-content">Access Denied</h1>
        <p class="text-base-content/60 max-w-sm">
          You don't have permission to view this page.
          Contact your administrator if you think this is a mistake.
        </p>
      </div>

      <div class="flex gap-3">
        <a routerLink="/dashboard" class="btn btn-primary btn-sm">
          Back to Dashboard
        </a>
        <a routerLink="/chat" class="btn btn-ghost btn-sm">
          Ask AI Assistant
        </a>
      </div>
    </div>
  `,
})
export class UnauthorizedComponent {}
