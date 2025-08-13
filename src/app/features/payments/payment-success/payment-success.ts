import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payment-success.html',
  styleUrl: './payment-success.css'
})
export class PaymentSuccess {

}
