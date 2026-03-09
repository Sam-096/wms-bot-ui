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
import { InwardService } from '../../../core/services/inward.service';
import { LoadingService } from '../../../core/services/loading.service';
import { ToastService } from '../../../core/services/toast.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { CreateInwardRequest } from '../../../core/models/business.model';

type Step = 1 | 2 | 3;

const COMMODITIES = ['Rice', 'Wheat', 'Maize', 'Jowar', 'Bajra', 'Paddy', 'Barley', 'Soybean'];
const GRADES      = ['FAQ', 'Grade A', 'Grade B', 'Grade C'];

@Component({
  selector: 'app-inward-new',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inward-new.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InwardNew {
  private readonly router       = inject(Router);
  private readonly auth         = inject(AuthService);
  private readonly inwardSvc    = inject(InwardService);
  private readonly loading      = inject(LoadingService);
  private readonly toast        = inject(ToastService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly destroyRef   = inject(DestroyRef);

  readonly step            = signal<Step>(1);
  readonly showCancelModal = signal(false);
  readonly submitting$     = this.loading.isLoading$('inward-save');

  readonly commodities = COMMODITIES;
  readonly grades      = GRADES;

  // Plain properties for clean ngModel two-way binding
  vehicleNo   = '';
  driverName  = '';
  driverPhone = '';
  commodity   = '';
  grade       = '';
  bags: number | null   = null;
  weight: number | null = null;
  remarks = '';

  isStep1Valid(): boolean {
    return this.vehicleNo.trim().length >= 4 && this.driverName.trim().length >= 2;
  }

  isStep2Valid(): boolean {
    return (
      this.commodity !== '' &&
      this.bags !== null && this.bags > 0 &&
      this.weight !== null && this.weight > 0
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

    const request: CreateInwardRequest = {
      commodityName: this.commodity,
      bags:          this.bags!,
      unitWeight:    this.weight!,
      supplierName:  this.driverName,
      vehicleNo:     this.vehicleNo,
      grnNumber:     `GRN-${Date.now()}`,
      remarks:       this.remarks || undefined,
      warehouseId,
    };

    this.loading.wrap('inward-save', this.inwardSvc.create(request))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Entry Saved', 'Inward entry recorded successfully.');
          void this.router.navigate(['/inward']);
        },
        error: (err: HttpErrorResponse) => {
          this.errorHandler.handleApiError(err);
        },
      });
  }

  openCancelModal(): void  { this.showCancelModal.set(true); }
  dismissCancel(): void    { this.showCancelModal.set(false); }
  confirmCancel(): void    { void this.router.navigate(['/inward']); }
}
