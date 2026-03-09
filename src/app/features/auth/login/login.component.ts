import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { RealtimeService } from '../../../core/services/realtime.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly fb         = inject(FormBuilder);
  private readonly auth       = inject(AuthService);
  private readonly toast      = inject(ToastService);
  private readonly router     = inject(Router);
  private readonly route      = inject(ActivatedRoute);
  private readonly realtime   = inject(RealtimeService);
  private readonly destroyRef = inject(DestroyRef);

  readonly showPassword = signal(false);
  readonly loading      = signal(false);

  readonly form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get email()    { return this.form.controls.email; }
  get password() { return this.form.controls.password; }

  submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);

    this.auth.login(this.email.value!, this.password.value!)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const { user } = res;
          this.toast.success('Welcome Back', `Good to see you, ${user.username}!`);

          // Connect real-time warehouse events for the session
          this.realtime.connect(user.warehouseId);

          // Navigate to returnUrl if present, else role-appropriate default
          const returnUrl    = this.route.snapshot.queryParamMap.get('returnUrl');
          const defaultRoute = this.auth.getDefaultRouteForRole(user.role);
          void this.router.navigateByUrl(returnUrl ?? defaultRoute);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          if (err.status === 401 || err.status === 400) {
            this.toast.error('Login Failed', 'Invalid email or password.');
          } else {
            this.toast.error('Server Error', 'Please try again.');
          }
        },
      });
  }
}
