import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../../core/services/auth.service';
import { OutwardService } from '../../../core/services/outward.service';
import { LoadingService } from '../../../core/services/loading.service';
import { ToastService } from '../../../core/services/toast.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { CreateOutwardRequest } from '../../../core/models/business.model';

type Step = 1 | 2 | 3;

const COMMODITIES = ['Rice', 'Wheat', 'Maize', 'Jowar', 'Bajra', 'Paddy', 'Barley', 'Soybean'];
const PURPOSES    = ['Sale', 'Transfer', 'Return', 'Sample', 'Other'];

@Component({
  selector: 'app-outward-new',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './outward-new.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutwardNew {
  private readonly router       = inject(Router);
  private readonly auth         = inject(AuthService);
  private readonly outwardSvc   = inject(OutwardService);
  private readonly loading      = inject(LoadingService);
  private readonly toast        = inject(ToastService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly destroyRef   = inject(DestroyRef);

  readonly step            = signal<Step>(1);
  readonly showCancelModal = signal(false);
  readonly submitting$     = this.loading.isLoading$('outward-save');

  readonly commodities = COMMODITIES;
  readonly purposes    = PURPOSES;

  vehicleNo   = '';
  driverName  = '';
  driverPhone = '';
  commodity   = '';
  bags: number | null = null;
  destination = '';
  purpose     = '';
  remarks     = '';

  isStep1Valid(): boolean {
    return this.vehicleNo.trim().length >= 4 && this.driverName.trim().length >= 2;
  }

  isStep2Valid(): boolean {
    return (
      this.commodity !== '' &&
      this.bags !== null && this.bags > 0 &&
      this.destination.trim().length >= 2 &&
      this.purpose !== ''
    );
  }

  next(): void {
    if (this.step() < 3) this.step.update((s) => (s + 1) as Step);
  }

  back(): void {
    if (this.step() > 1) this.step.update((s) => (s - 1) as Step);
  }

  submit(): void {
    const warehouseId = this.auth.getWarehouseId();
    if (!warehouseId) {
      this.toast.error('Not Logged In', 'Please log in again.');
      return;
    }

    const request: CreateOutwardRequest = {
      commodity:   this.commodity,
      bags:        this.bags!,
      destination: this.destination.trim(),
      vehicleNo:   this.vehicleNo,
      purpose:     this.purpose,
      remarks:     this.remarks || undefined,
      warehouseId,
    };

    this.loading.wrap('outward-save', this.outwardSvc.create(request))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Dispatch Saved', 'Outward entry recorded successfully.');
          void this.router.navigate(['/outward']);
        },
        error: (err: HttpErrorResponse) => {
          this.errorHandler.handleApiError(err);
        },
      });
  }

  openCancelModal(): void { this.showCancelModal.set(true); }
  dismissCancel(): void   { this.showCancelModal.set(false); }
  confirmCancel(): void   { void this.router.navigate(['/outward']); }
}
