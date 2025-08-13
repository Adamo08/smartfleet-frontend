import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-payment-methods',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payment-methods.html',
  styleUrl: './payment-methods.css'
})
export class PaymentMethods {

}
