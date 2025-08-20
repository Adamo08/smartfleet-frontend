import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../../../../core/services/payment.service';
import { Page, Pageable } from '../../../../core/models/pagination.interface';
import { PaymentDetailsDto } from '../../../../core/models/payment.interface';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transaction-list.html',
  styleUrl: './transaction-list.css'
})
export class TransactionList implements OnInit {
  payments: PaymentDetailsDto[] = [];
  page = 0;
  size = 10;
  totalElements = 0;
  isLoading = false;

  constructor(private paymentService: PaymentService) {}

  ngOnInit(): void {
    this.load();
  }

  load(page: number = this.page): void {
    this.isLoading = true;
    const pageable: Pageable = { page, size: this.size } as Pageable;
    this.paymentService.getAllPaymentsAdmin(pageable).subscribe({
      next: (res: Page<PaymentDetailsDto>) => {
        this.payments = res.content;
        this.totalElements = res.totalElements;
        this.page = res.number;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
