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

  getStatusColor(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.PENDING:
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case PaymentStatus.COMPLETED:
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case PaymentStatus.FAILED:
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case PaymentStatus.REFUNDED:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  }

  getProviderDisplayName(provider: string): string {
    switch (provider?.toLowerCase()) {
      case 'paypal':
      case 'paypalpaymentprovider':
        return 'PayPal';
      case 'onsite':
      case 'onsitepaymentprovider':
        return 'On-site Payment';
      default:
        return provider || 'Unknown';
    }
  }
}
