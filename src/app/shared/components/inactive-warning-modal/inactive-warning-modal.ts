import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VehicleStatusInfo } from '../../../core/services/vehicle-status.service';

// @ts-ignore
@Component({
  selector: 'app-inactive-warning-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <!-- Modal Backdrop with fade-in animation -->
      <div
        class="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
        (click)="onBackdropClick($event)"
      >
        <!-- Backdrop with blur effect -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm transition-all duration-300 animate-fade-in"></div>

        <!-- Modal Content with popup animation -->
        <div class="relative z-10 w-full max-w-lg mx-4 transform transition-all duration-300 scale-100 animate-modal-bounce-in">
          <div class="backdrop-blur-xl bg-slate-900/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            <!-- Warning Icon & Header with slide-in animation -->
            <div class="px-8 py-6 text-center border-b border-white/10 bg-gradient-to-r from-orange-500/10 to-red-500/10 animate-slide-in-down">
              <div class="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
              </div>
              <h3 class="text-2xl font-bold text-white mb-2 animate-fade-in-up">Set {{ entityType | titlecase }} Inactive?</h3>
              <p class="text-gray-300 animate-fade-in-up">This action will affect vehicle availability</p>
            </div>

            <!-- Modal Body with fade-in animation -->
            <div class="px-8 py-6 animate-fade-in-up">
              <!-- Impact Summary with slide-in animation -->
              <div class="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10 animate-slide-in-up">
                <h4 class="text-lg font-semibold text-white mb-3">Impact Summary</h4>
                <div class="grid grid-cols-1 gap-3">
                  <div class="flex justify-between items-center animate-fade-in-up">
                    <span class="text-gray-300">Affected Vehicles:</span>
                    <span class="text-white font-semibold">{{ statusInfo?.affectedVehicles || 0 }}</span>
                  </div>
                  @if (statusInfo &&  statusInfo.futureReservations > 0) {
                    <div class="flex justify-between items-center animate-fade-in-up">
                      <span class="text-gray-300">Future Reservations:</span>
                      <span class="text-orange-400 font-semibold">{{ statusInfo.futureReservations }} will be cancelled</span>
                    </div>
                  }
                  @if (statusInfo?.hasActiveReservations) {
                    <div class="flex justify-between items-center animate-fade-in-up">
                      <span class="text-gray-300">Active Reservations:</span>
                      <span class="text-blue-400 font-semibold">Will continue normally</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Warnings with slide-in animation -->
              @if (warnings && warnings.length > 0) {
                <div class="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 mb-6 animate-slide-in-up">
                  <h4 class="text-lg font-semibold text-orange-400 mb-3 flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                    </svg>
                    Warnings
                  </h4>
                  <ul class="text-orange-300 text-sm space-y-1">
                    @for (warning of warnings; track warning; let i = $index) {
                      <li class="flex items-start animate-fade-in-up" [style.animation-delay]="(i * 100) + 'ms'">
                        <span class="text-orange-400 mr-2">•</span>
                        <span>{{ warning }}</span>
                      </li>
                    }
                  </ul>
                </div>
              }

              <!-- Custom Message with slide-in animation -->
              @if (message) {
                <div class="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10 animate-slide-in-up">
                  <p class="text-gray-300 text-sm">{{ message }}</p>
                </div>
              }

              <!-- Action Buttons with slide-in animation -->
              <div class="flex space-x-3 animate-slide-in-up">
                <button
                  (click)="onCancel()"
                  class="flex-1 backdrop-blur-sm bg-white/10 border border-white/20 text-white py-3 px-4 rounded-2xl font-semibold transition-all duration-300 hover:bg-white/20 hover:border-white/30 hover:scale-105 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  (click)="onConfirm()"
                  class="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white py-3 px-4 rounded-2xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95"
                >
                  Set Inactive
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class InactiveWarningModal {
  @Input() isOpen: boolean = false;
  @Input() entityType: 'brand' | 'category' | 'model' = 'brand';
  @Input() entityName: string = '';
  @Input() statusInfo: VehicleStatusInfo | null = null;
  @Input() warnings: string[] = [];
  @Input() message: string = '';
  @Input() closeOnBackdropClick: boolean = true;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
    this.close.emit();
  }

  onCancel(): void {
    this.cancel.emit();
    this.close.emit();
  }

  onBackdropClick(event: Event): void {
    if (this.closeOnBackdropClick && event.target === event.currentTarget) {
      this.close.emit();
    }
  }
}
