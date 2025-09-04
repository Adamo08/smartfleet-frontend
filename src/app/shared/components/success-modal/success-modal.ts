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
        <div class="relative z-10 w-full max-w-md mx-4 transform transition-all duration-300 scale-100">
          <div class="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
            <!-- Success Icon & Header -->
            <div class="px-8 py-6 text-center border-b border-gray-100 bg-green-50">
              <div class="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <h3 class="text-2xl font-bold text-gray-900 mb-2">{{ title || 'Success!' }}</h3>
              <p class="text-gray-600">{{ message || 'Operation completed successfully' }}</p>
            </div>

            <!-- Modal Body -->
            <div class="px-8 py-6">
              @if (details) {
                <div class="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                  <p class="text-gray-700 text-sm">{{ details }}</p>
                </div>
              }

              <!-- Action Buttons -->
              <div class="flex space-x-3">
                @if (showSecondaryAction && secondaryActionText) {
                  <button
                    (click)="onSecondaryAction()"
                    class="flex-1 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold transition-all duration-200 hover:bg-gray-50 hover:border-gray-400"
                  >
                    {{ secondaryActionText }}
                  </button>
                }
                <button
                  (click)="onPrimaryAction()"
                  class="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200"
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
