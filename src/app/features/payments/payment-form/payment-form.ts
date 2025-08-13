import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payment-form.html',
  styleUrl: './payment-form.css'
})
export class PaymentForm {

}
