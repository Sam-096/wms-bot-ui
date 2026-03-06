import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Warehouse, AppRole } from '../../../core/models/auth.model';

function passwordMatchValidator(ctrl: AbstractControl): ValidationErrors | null {
  const pw  = ctrl.get('password')?.value;
  const cpw = ctrl.get('confirmPassword')?.value;
  return pw && cpw && pw !== cpw ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent implements OnInit {
  private readonly fb     = inject(FormBuilder);
  private readonly auth   = inject(AuthService);
  private readonly toast  = inject(ToastService);
  private readonly router = inject(Router);

  readonly showPassword    = signal(false);
  readonly showConfirm     = signal(false);
  readonly loading         = signal(false);
  readonly warehouses      = signal<Warehouse[]>([]);
  readonly warehousesError = signal(false);

  readonly roles: { value: AppRole; label: string }[] = [
    { value: 'MANAGER',    label: '📦 Manager' },
    { value: 'OPERATOR',   label: '🔧 Operator' },
    { value: 'GATE_STAFF', label: '🚪 Gate Staff' },
    { value: 'VIEWER',     label: '👁 Viewer' },
  ];

  readonly form = this.fb.group(
    {
      fullName:        ['', [Validators.required, Validators.minLength(3)]],
      email:           ['', [Validators.required, Validators.email]],
      password:        ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      role:            ['', Validators.required],
      warehouseId:     ['', Validators.required],
    },
    { validators: passwordMatchValidator },
  );

  get fullName()        { return this.form.controls.fullName; }
  get email()           { return this.form.controls.email; }
  get password()        { return this.form.controls.password; }
  get confirmPassword() { return this.form.controls.confirmPassword; }
  get role()            { return this.form.controls.role; }
  get warehouseId()     { return this.form.controls.warehouseId; }

  readonly passwordStrength = computed(() => {
    const pw: string = this.password.value ?? '';
    if (pw.length < 6) return 0;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score; // 0–4
  });

  readonly strengthLabel = computed(() => {
    const s = this.passwordStrength();
    if (s <= 1) return { label: 'Weak',   cls: 'text-error' };
    if (s <= 2) return { label: 'Medium', cls: 'text-warning' };
    return              { label: 'Strong', cls: 'text-success' };
  });

  ngOnInit(): void {
    this.auth.getWarehouses().subscribe({
      next:  (list) => this.warehouses.set(list),
      error: ()     => this.warehousesError.set(true),
    });
  }

  submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);

    const v = this.form.value;
    this.auth
      .register({
        fullName:    v.fullName!,
        email:       v.email!,
        password:    v.password!,
        role:        v.role as AppRole,
        warehouseId: v.warehouseId!,
      })
      .subscribe({
        next: () => {
          this.toast.success('Account created! Welcome to Godown AI 🎉');
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.loading.set(false);
          if (err?.status === 409) {
            this.toast.error('Email already registered. Please login.');
          } else {
            this.toast.error('Registration failed. Please try again.');
          }
        },
      });
  }
}
