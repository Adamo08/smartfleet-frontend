import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PaymentService } from '../../../../core/services/payment.service';
import { RefundDetailsDto, RefundReason, RefundMethod } from '../../../../core/models/payment.interface';
import { RefundStatus } from '../../../../core/enums/refund-status.enum';
import { SuccessModalService } from '../../../../shared/services/success-modal.service';
import { ToastrService } from 'ngx-toastr';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { Page, Pageable } from '../../../../core/models/pagination.interface';
import { RefundCountService } from '../../../../core/services/refund-count.service';

@Component({
  selector: 'app-refund-requests',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, Pagination],
  templateUrl: './refund-requests.html',
  styleUrl: './refund-requests.css'
})
export class RefundRequests implements OnInit {
  refundRequestsPage!: Page<RefundDetailsDto>;
  loading = false;
  error: string | null = null;
  showDeclineModal = false;
  selectedRefundId: number | null = null;
  declineForm: FormGroup;
  
  // Pagination
  currentPage: number = 0;
  pageSize: number = 10;
  
  readonly RefundStatus = RefundStatus;

  constructor(
    private paymentService: PaymentService,
    private successModalService: SuccessModalService,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private refundCountService: RefundCountService
  ) {
    this.declineForm = this.fb.group({
      adminNotes: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    this.loadRefundRequests();
  }

  loadRefundRequests(): void {
    this.loading = true;
    this.error = null;

    const pageable: Pageable = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: 'requestedAt',
      sortDirection: 'DESC'
    };

    this.paymentService.getRefundRequests(pageable).subscribe({
      next: (response) => {
        this.refundRequestsPage = response;
        this.currentPage = response.number;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading refund requests:', error);
        this.error = 'Failed to load refund requests';
        this.loading = false;
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadRefundRequests();
  }

  approveRefund(refundId: number): void {
    this.paymentService.approveRefund(refundId).subscribe({
      next: () => {
        this.successModalService.show({
          title: 'Refund Approved!',
          message: 'The refund request has been approved and processed successfully.',
          details: `Refund ID: ${refundId}`,
          autoClose: true,
          autoCloseDelay: 4000
        });
        // Decrement the pending refund count
        this.refundCountService.decrementPendingRefundCount();
        this.loadRefundRequests(); // Reload the list
      },
      error: (error) => {
        console.error('Error approving refund:', error);
        this.toastr.error('Failed to approve refund request');
      }
    });
  }

  openDeclineModal(refundId: number): void {
    this.selectedRefundId = refundId;
    this.declineForm.reset();
    this.showDeclineModal = true;
  }

  closeDeclineModal(): void {
    this.showDeclineModal = false;
    this.selectedRefundId = null;
    this.declineForm.reset();
  }

  declineRefund(): void {
    if (this.declineForm.invalid || !this.selectedRefundId) {
      this.toastr.error('Please provide valid admin notes (minimum 10 characters)');
      return;
    }

    const adminNotes = this.declineForm.get('adminNotes')?.value;
    
    this.paymentService.declineRefund(this.selectedRefundId, adminNotes).subscribe({
      next: () => {
        this.successModalService.show({
          title: 'Refund Declined!',
          message: 'The refund request has been declined.',
          details: `Refund ID: ${this.selectedRefundId} | Notes: ${adminNotes}`,
          autoClose: true,
          autoCloseDelay: 4000
        });
        // Decrement the pending refund count
        this.refundCountService.decrementPendingRefundCount();
        this.closeDeclineModal();
        this.loadRefundRequests(); // Reload the list
      },
      error: (error) => {
        console.error('Error declining refund:', error);
        this.toastr.error('Failed to decline refund request');
      }
    });
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

  getTotalAmount(): number {
    if (!this.refundRequestsPage || !this.refundRequestsPage.content) {
      return 0;
    }
    return this.refundRequestsPage.content.reduce((sum, refund) => sum + refund.amount, 0);
  }

  getStatusColor(status: RefundStatus): string {
    switch (status) {
      case RefundStatus.REQUESTED:
        return 'bg-yellow-500 text-yellow-300 border-yellow-500/30';
      case RefundStatus.PENDING:
        return 'bg-blue-500 text-blue-300 border-blue-500/30';
      case RefundStatus.PROCESSED:
        return 'bg-green-500 text-green-300 border-green-500/30';
      case RefundStatus.FAILED:
        return 'bg-red-500 text-red-300 border-red-500/30';
      case RefundStatus.DECLINED:
        return 'bg-gray-500 text-gray-300 border-gray-500/30';
      default:
        return 'bg-gray-500 text-gray-300 border-gray-500/30';
    }
  }
}
