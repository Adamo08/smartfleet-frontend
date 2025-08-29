import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { PaymentService, PaymentFilter } from '../../../../core/services/payment.service';
import { Page, Pageable, Sort } from '../../../../core/models/pagination.interface';
import { PaymentDetailsDto } from '../../../../core/models/payment.interface';
import { PaymentStatus } from '../../../../core/enums/payment-status.enum';
import { Modal } from '../../../../shared/components/modal/modal';
import { ConfigrmDialog, DialogActionType } from '../../../../shared/components/configrm-dialog/configrm-dialog';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { PaymentDetail } from '../payment-detail/payment-detail';
import { RefundManagement } from '../refund-management/refund-management'; 

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Modal, ConfigrmDialog, Pagination, PaymentDetail, RefundManagement],
  templateUrl: './transaction-list.html',
  styleUrl: './transaction-list.css'
})
export class TransactionList implements OnInit {
  paymentsPage!: Page<PaymentDetailsDto>;
  filterForm: FormGroup;
  isLoading = false;

  currentPage = 0;
  pageSize = 10;
  sortBy = 'id';
  sortDirection: 'ASC' | 'DESC' = 'DESC';

  selectedPayment: PaymentDetailsDto | null = null;
  showPaymentDetailModal = false;
  showRefundModal = false;
  showDeletePaymentModal = false;
  paymentToDelete: PaymentDetailsDto | null = null;
  paymentToRefund: PaymentDetailsDto | null = null;

  readonly PaymentStatus = PaymentStatus;
  readonly DialogActionType = DialogActionType;

  constructor(private paymentService: PaymentService, private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      userId: [null],
      reservationId: [null],
      status: [''],
      minAmount: [null],
      maxAmount: [null],
      startDate: [null],
      endDate: [null],
      searchTerm: ['']
    });
  }

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.isLoading = true;
    const pageable: Pageable = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };

    const filter: PaymentFilter = {
      userId: this.filterForm.value.userId || undefined,
      reservationId: this.filterForm.value.reservationId || undefined,
      status: this.filterForm.value.status || undefined,
      minAmount: this.filterForm.value.minAmount || undefined,
      maxAmount: this.filterForm.value.maxAmount || undefined,
      startDate: this.filterForm.value.startDate ? new Date(this.filterForm.value.startDate) : undefined,
      endDate: this.filterForm.value.endDate ? new Date(this.filterForm.value.endDate) : undefined,
      searchTerm: this.filterForm.value.searchTerm || undefined
    };

    this.paymentService.getAllPaymentsAdmin(filter, pageable).subscribe({
      next: (page) => {
        this.paymentsPage = page;
        this.currentPage = page.number;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching payments:', err);
        this.isLoading = false;
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadPayments();
  }

  onSortChange(sortBy: string): void {
    if (this.sortBy === sortBy) {
      this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = sortBy;
      this.sortDirection = 'DESC'; // Default to DESC for new sorts, can be ASC too.
    }
    this.loadPayments();
  }

  onFilterChange(): void {
    this.currentPage = 0; // Reset to first page on filter change
    this.loadPayments();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.currentPage = 0;
    this.loadPayments();
  }

  viewPayment(payment: PaymentDetailsDto): void {
    this.selectedPayment = payment;
    this.showPaymentDetailModal = true;
  }

  closePaymentDetailModal(): void {
    this.showPaymentDetailModal = false;
    this.selectedPayment = null;
  }

  openDeletePaymentModal(payment: PaymentDetailsDto): void {
    this.paymentToDelete = payment;
    this.showDeletePaymentModal = true;
  }

  confirmDeletePayment(): void {
    if (this.paymentToDelete && this.paymentToDelete.id) {
      this.paymentService.deletePayment(this.paymentToDelete.id).subscribe({
        next: () => {
          this.closeDeletePaymentModal();
          this.loadPayments();
        },
        error: (err) => console.error('Error deleting payment:', err)
      });
    }
  }

  closeDeletePaymentModal(): void {
    this.showDeletePaymentModal = false;
    this.paymentToDelete = null;
  }

  // Complete on-site payment after verifying actual payment at location
  completeOnsitePayment(payment: PaymentDetailsDto): void {
    if (payment.provider !== 'onSitePaymentProvider') {
      console.error('Only on-site payments can be completed via this method');
      return;
    }

    if (payment.status !== PaymentStatus.PENDING) {
      console.error('Only pending payments can be completed');
      return;
    }

    // Prompt admin for notes
    const adminNotes = prompt('Enter any notes about the payment verification (optional):');
    
    this.paymentService.completeOnsitePayment(payment.reservationId, adminNotes || '').subscribe({
      next: (response: any) => {
        console.log('On-site payment completed successfully:', response);
        // Reload payments to show updated status
        this.loadPayments();
      },
      error: (err: any) => {
        console.error('Failed to complete on-site payment:', err);
      }
    });
  }

  // Check if payment can be completed (on-site and pending)
  canCompleteOnsitePayment(payment: PaymentDetailsDto): boolean {
    return payment.provider === 'onSitePaymentProvider' && payment.status === PaymentStatus.PENDING;
  }

  // Open refund modal
  openRefundModal(payment: PaymentDetailsDto): void {
    this.paymentToRefund = payment;
    this.showRefundModal = true;
  }

  // Handle refund processed
  onRefundProcessed(): void {
    this.closeRefundModal();
    this.loadPayments(); // Reload the payment list
  }

  // Close refund modal
  closeRefundModal(): void {
    this.showRefundModal = false;
    this.paymentToRefund = null;
  }

  // Check if payment can be refunded
  canRefund(payment: PaymentDetailsDto): boolean {
    return payment.status === PaymentStatus.COMPLETED;
  }
}
