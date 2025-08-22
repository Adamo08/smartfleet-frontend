import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentDetailsDto } from '../../../../core/models/payment.interface';
import { PaymentStatus} from '../../../../core/enums/payment-status.enum';

@Component({
  selector: 'app-payment-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-detail.html',
  styleUrl: './payment-detail.css'
})
export class PaymentDetail {
  @Input() payment!: PaymentDetailsDto;
  readonly PaymentStatus = PaymentStatus;
}
