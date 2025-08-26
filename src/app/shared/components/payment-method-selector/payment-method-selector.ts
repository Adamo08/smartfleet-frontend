import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentMethod } from '../../../core/services/payment-processing.service';

@Component({
  selector: 'app-payment-method-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="payment-method-selector">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Select Payment Method
      </label>
      
      <div class="space-y-3">
        <div 
          *ngFor="let method of availableMethods" 
          class="payment-method-option"
          [class.selected]="selectedMethodId === method.id"
          [class.disabled]="!method.isActive"
          (click)="selectMethod(method)"
        >
          <div class="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors"
               [class.border-blue-500]="selectedMethodId === method.id"
               [class.border-gray-300]="selectedMethodId !== method.id"
               [class.bg-blue-50]="selectedMethodId === method.id"
               [class.bg-gray-50]="!method.isActive">
            
            <div class="text-2xl">{{ method.icon }}</div>
            
            <div class="flex-1">
              <div class="font-medium text-gray-900">{{ method.name }}</div>
              <div class="text-sm text-gray-500">{{ method.description }}</div>
            </div>
            
            <div class="flex items-center space-x-2">
              <div *ngIf="!method.isActive" class="text-xs text-red-500 bg-red-100 px-2 py-1 rounded">
                Unavailable
              </div>
              <div *ngIf="selectedMethodId === method.id" class="text-blue-500">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div *ngIf="errorMessage" class="mt-2 text-sm text-red-600">
        {{ errorMessage }}
      </div>
    </div>
  `,
  styles: [`
    .payment-method-selector {
      @apply w-full;
    }
    
    .payment-method-option {
      @apply transition-all duration-200;
    }
    
    .payment-method-option:hover:not(.disabled) {
      @apply transform scale-[1.02];
    }
    
    .payment-method-option.disabled {
      @apply cursor-not-allowed opacity-60;
    }
    
    .payment-method-option.selected {
      @apply ring-2 ring-blue-500 ring-opacity-50;
    }
  `]
})
export class PaymentMethodSelector implements OnInit {
  @Input() availableMethods: PaymentMethod[] = [];
  @Input() selectedMethodId: string | null = null;
  @Input() errorMessage: string | null = null;
  @Input() disabled: boolean = false;
  
  @Output() methodSelected = new EventEmitter<PaymentMethod>();
  @Output() methodChange = new EventEmitter<string>();

  ngOnInit(): void {
    // Auto-select first available method if none selected
    if (!this.selectedMethodId && this.availableMethods.length > 0) {
      const firstAvailable = this.availableMethods.find(m => m.isActive);
      if (firstAvailable) {
        this.selectMethod(firstAvailable);
      }
    }
  }

  selectMethod(method: PaymentMethod): void {
    if (this.disabled || !method.isActive) {
      return;
    }

    this.selectedMethodId = method.id;
    this.methodSelected.emit(method);
    this.methodChange.emit(method.id);
  }

  isMethodAvailable(method: PaymentMethod): boolean {
    return method.isActive && !this.disabled;
  }
}

