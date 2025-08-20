import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-payment-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payment-settings.html',
  styleUrl: './payment-settings.css'
})
export class PaymentSettings {
  form!: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      paypalActive: [true],
      cmiActive: [false]
    });
  }

  save(): void {
    // Placeholder: save to backend when settings API is available
  }
}
