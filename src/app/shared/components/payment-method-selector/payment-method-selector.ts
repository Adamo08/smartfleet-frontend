import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentMethod } from '../../../core/services/payment-processing.service';

@Component({
  selector: 'app-payment-method-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-method-selector.html'
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

