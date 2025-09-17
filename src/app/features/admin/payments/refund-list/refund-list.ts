import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PaymentService } from '../../../../core/services/payment.service';
import { RefundDetailsDto, RefundReason, RefundMethod } from '../../../../core/models/payment.interface';
import { RefundStatus } from '../../../../core/enums/refund-status.enum';
import { SuccessModalService } from '../../../../shared/services/success-modal.service';
import { ToastrService } from 'ngx-toastr';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { Page, Pageable } from '../../../../core/models/pagination.interface';

@Component({
  selector: 'app-refund-list',
  standalone: true,
  imports: [CommonModule, RouterModule, Pagination],
  templateUrl: './refund-list.html',
  styleUrl: './refund-list.css'
})
export class RefundList implements OnInit {
  refundsPage!: Page<RefundDetailsDto>;
  loading = false;
  error: string | null = null;
  
  // Pagination
  currentPage: number = 0;
  pageSize: number = 10;
  
  readonly RefundStatus = RefundStatus;

  constructor(
    private paymentService: PaymentService,
    private successModalService: SuccessModalService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadRefunds();
  }

  loadRefunds(): void {
    this.loading = true;
    this.error = null;

    const pageable: Pageable = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: 'requestedAt',
      sortDirection: 'DESC'
    };

    this.paymentService.getAllRefunds({}, pageable).subscribe({
      next: (response) => {
        this.refundsPage = response;
        this.currentPage = response.number;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading refunds:', error);
        this.error = 'Failed to load refunds';
        this.loading = false;
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadRefunds();
  }

  getReasonLabel(reason: string): string {
    const reasons = this.getRefundReasons();
    const reasonObj = reasons.find(r => r.value === reason);
    return reasonObj ? reasonObj.label : reason;
  }

  getRefundReasons(): { value: RefundReason; label: string }[] {
    return [
      { value: RefundReason.VEHICLE_UNAVAILABLE, label: 'Vehicle became unavailable' },
      { value: RefundReason.CANCELLATION_BY_CUSTOMER, label: 'Customer cancelled reservation' },
      { value: RefundReason.TECHNICAL_ISSUE, label: 'Technical issue with booking' },
      { value: RefundReason.DUPLICATE_PAYMENT, label: 'Duplicate payment made' },
      { value: RefundReason.WRONG_AMOUNT, label: 'Incorrect amount charged' },
      { value: RefundReason.SERVICE_NOT_PROVIDED, label: 'Service not provided as expected' },
      { value: RefundReason.EMERGENCY_CANCELLATION, label: 'Emergency cancellation' },
      { value: RefundReason.WEATHER_CONDITIONS, label: 'Weather conditions prevented service' },
      { value: RefundReason.VEHICLE_DAMAGE, label: 'Vehicle damage before rental' },
      { value: RefundReason.OTHER, label: 'Other reason' }
    ];
  }

  getRefundMethodLabel(method: string): string {
    const methods = this.getRefundMethods();
    const methodObj = methods.find(m => m.value === method);
    return methodObj ? methodObj.label : method;
  }

  getRefundMethods(): { value: RefundMethod; label: string }[] {
    return [
      { value: RefundMethod.ORIGINAL_PAYMENT_METHOD, label: 'Original Payment Method' },
      { value: RefundMethod.PAYPAL, label: 'PayPal' },
      { value: RefundMethod.ONSITE_CASH, label: 'On-site Cash Refund' }
    ];
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getStatusColor(status: RefundStatus): string {
    switch (status) {
      case RefundStatus.REQUESTED:
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case RefundStatus.PENDING:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case RefundStatus.PROCESSED:
        return 'bg-green-100 text-green-800 border-green-200';
      case RefundStatus.PARTIALLY_PROCESSED:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case RefundStatus.FAILED:
        return 'bg-red-100 text-red-800 border-red-200';
      case RefundStatus.DECLINED:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  getStatusCount(status: RefundStatus): number {
    return this.refundsPage?.content?.filter(refund => refund.status === status).length || 0;
  }

  getTotalAmount(): number {
    return this.refundsPage?.content?.reduce((sum, refund) => sum + refund.amount, 0) || 0;
  }

  getProcessedAmount(): number {
    return this.refundsPage?.content
      ?.filter(refund => refund.status === RefundStatus.PROCESSED || refund.status === RefundStatus.PARTIALLY_PROCESSED)
      .reduce((sum, refund) => sum + refund.amount, 0) || 0;
  }
}
