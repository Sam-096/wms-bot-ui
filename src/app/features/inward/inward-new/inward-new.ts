import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

type Step = 1 | 2 | 3;

const COMMODITIES = ['Rice', 'Wheat', 'Maize', 'Jowar', 'Bajra', 'Paddy', 'Barley', 'Soybean'];
const GRADES = ['FAQ', 'Grade A', 'Grade B', 'Grade C'];

@Component({
  selector: 'app-inward-new',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inward-new.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InwardNew {
  private readonly router = inject(Router);

  readonly step = signal<Step>(1);
  readonly showCancelModal = signal(false);
  readonly submitting = signal(false);

  readonly commodities = COMMODITIES;
  readonly grades = GRADES;

  // Plain properties for clean ngModel two-way binding
  vehicleNo = '';
  driverName = '';
  driverPhone = '';
  commodity = '';
  grade = '';
  bags: number | null = null;
  weight: number | null = null;
  remarks = '';

  isStep1Valid(): boolean {
    return this.vehicleNo.trim().length >= 4 && this.driverName.trim().length >= 2;
  }

  isStep2Valid(): boolean {
    return (
      this.commodity !== '' &&
      this.bags !== null &&
      this.bags > 0 &&
      this.weight !== null &&
      this.weight > 0
    );
  }

  next(): void {
    if (this.step() < 3) this.step.update((s) => (s + 1) as Step);
  }

  back(): void {
    if (this.step() > 1) this.step.update((s) => (s - 1) as Step);
  }

  async submit(): Promise<void> {
    this.submitting.set(true);
    await new Promise((r) => setTimeout(r, 900));
    this.submitting.set(false);
    this.router.navigate(['/inward']);
  }

  openCancelModal(): void {
    this.showCancelModal.set(true);
  }

  dismissCancel(): void {
    this.showCancelModal.set(false);
  }

  confirmCancel(): void {
    this.router.navigate(['/inward']);
  }
}
