import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-success-modal',
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
        <div class="relative z-10 w-full max-w-md mx-4 transform transition-all duration-300 scale-100 animate-modal-bounce-in">
          <div class="backdrop-blur-xl bg-slate-900/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            <!-- Success Icon & Header with slide-in animation -->
            <div class="px-8 py-6 text-center border-b border-white/10 bg-gradient-to-r from-green-500/10 to-emerald-500/10 animate-slide-in-down">
              <div class="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <h3 class="text-2xl font-bold text-white mb-2 animate-fade-in-up">{{ title || 'Success!' }}</h3>
              <p class="text-gray-300 animate-fade-in-up">{{ message || 'Operation completed successfully' }}</p>
            </div>

            <!-- Modal Body with fade-in animation -->
            <div class="px-8 py-6 animate-fade-in-up">
              @if (details) {
                <div class="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10 animate-slide-in-up">
                  <p class="text-gray-300 text-sm">{{ details }}</p>
                </div>
              }

              <!-- Action Buttons with slide-in animation -->
              <div class="flex space-x-3 animate-slide-in-up">
                @if (showSecondaryAction && secondaryActionText) {
                  <button
                    (click)="onSecondaryAction()"
                    class="flex-1 backdrop-blur-sm bg-white/10 border border-white/20 text-white py-3 px-4 rounded-2xl font-semibold transition-all duration-300 hover:bg-white/20 hover:border-white/30 hover:scale-105 active:scale-95"
                  >
                    {{ secondaryActionText }}
                  </button>
                }
                <button
                  (click)="onPrimaryAction()"
                  class="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white py-3 px-4 rounded-2xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95"
                >
                  {{ primaryActionText || 'OK' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class SuccessModal {
  @Input() isOpen: boolean = false;
  @Input() title: string = '';
  @Input() message: string = '';
  @Input() details: string = '';
  @Input() primaryActionText: string = 'OK';
  @Input() secondaryActionText: string = '';
  @Input() showSecondaryAction: boolean = false;
  @Input() closeOnBackdropClick: boolean = true;

  @Output() primaryAction = new EventEmitter<void>();
  @Output() secondaryAction = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  onPrimaryAction(): void {
    this.primaryAction.emit();
    this.close.emit();
  }

  onSecondaryAction(): void {
    this.secondaryAction.emit();
  }

  onBackdropClick(event: Event): void {
    if (this.closeOnBackdropClick && event.target === event.currentTarget) {
      this.close.emit();
    }
  }
}
