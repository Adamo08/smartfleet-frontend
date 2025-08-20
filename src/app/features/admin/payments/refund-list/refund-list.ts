import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../../../../core/services/payment.service';
import { RefundDetailsDto } from '../../../../core/models/payment.interface';
import { Page, Pageable } from '../../../../core/models/pagination.interface';

@Component({
  selector: 'app-refund-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './refund-list.html',
  styleUrl: './refund-list.css'
})
export class RefundList implements OnInit {
  refunds: RefundDetailsDto[] = [];
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
    this.paymentService.getRefundHistory(pageable).subscribe({
      next: (res: Page<RefundDetailsDto>) => {
        this.refunds = res.content;
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
