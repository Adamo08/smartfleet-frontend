import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payment-history.html',
  styleUrl: './payment-history.css'
})
export class PaymentHistory {

}
