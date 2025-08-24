import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { PaymentService, PaymentFilter } from '../../../core/services/payment.service';
import { PaymentDto } from '../../../core/models/payment.interface';
import { Page, Pageable } from '../../../core/models/pagination.interface';
import { PaymentStatus } from '../../../core/enums/payment-status.enum';
import { Pagination } from '../../../shared/components/pagination/pagination';
import { Modal } from '../../../shared/components/modal/modal';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, Pagination, Modal],
  templateUrl: './payment-history.html',
  styleUrl: './payment-history.css'
})
export class PaymentHistory implements OnInit, OnDestroy {
  paymentsPage!: Page<PaymentDto>;
  loading = false;
  error: string | null = null;
  
  // Pagination
  currentPage = 0;
  pageSize = 10;
  sortBy = 'createdAt';
  sortDirection: 'ASC' | 'DESC' = 'DESC';
  
  // Filtering
  filterForm: FormGroup;
  selectedStatus: PaymentStatus | '' = '';
  searchTerm = '';
  
  // Modal state
  showPaymentDetailModal = false;
  selectedPayment: PaymentDto | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private paymentService: PaymentService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      status: [''],
      searchTerm: [''],
      startDate: [''],
      endDate: ['']
    });
  }

  ngOnInit(): void {
    this.setupFilterListener();
    this.loadPayments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFilterListener(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 0;
        this.loadPayments();
      });
  }

  loadPayments(): void {
    this.loading = true;
    this.error = null;

    const pageable: Pageable = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };

    const filter: PaymentFilter = {
      status: this.filterForm.value.status || undefined,
      startDate: this.filterForm.value.startDate ? new Date(this.filterForm.value.startDate) : undefined,
      endDate: this.filterForm.value.endDate ? new Date(this.filterForm.value.endDate) : undefined,
      searchTerm: this.filterForm.value.searchTerm || undefined
    };

    // Use the filtered endpoint for better search capabilities
    this.paymentService.getUserPaymentHistoryWithFilter(filter, pageable).subscribe({
      next: (page: Page<PaymentDto>) => {
        this.paymentsPage = page;
        this.currentPage = page.number;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading payments:', error);
        this.error = 'Failed to load payments';
        this.loading = false;
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadPayments();
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 0;
    this.loadPayments();
  }

  // Helper for template page info
  getMaxPageElement(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.paymentsPage?.totalElements || 0);
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  getStatusColor(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return 'bg-green-500';
      case PaymentStatus.PENDING:
        return 'bg-yellow-500';
      case PaymentStatus.FAILED:
        return 'bg-red-500';
      case PaymentStatus.CANCELLED:
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  }

  getStatusText(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return 'Completed';
      case PaymentStatus.PENDING:
        return 'Pending';
      case PaymentStatus.FAILED:
        return 'Failed';
      case PaymentStatus.CANCELLED:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }

  onFilterReset(): void {
    this.filterForm.reset();
    this.currentPage = 0;
    this.loadPayments();
  }

  onSort(property: string): void {
    if (this.sortBy === property) {
      this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = property;
      this.sortDirection = 'ASC';
    }
    this.currentPage = 0;
    this.loadPayments();
  }

  getSortIconClass(property: string): string {
    if (this.sortBy !== property) return 'text-gray-400';
    return this.sortDirection === 'ASC' ? 'text-blue-500' : 'text-blue-500';
  }

  getSortIcon(property: string): string {
    if (this.sortBy !== property) return 'M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4';
    return this.sortDirection === 'ASC' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7';
  }

  onPaymentClick(payment: PaymentDto): void {
    this.openPaymentDetailModal(payment);
  }

  openPaymentDetailModal(payment: PaymentDto): void {
    this.selectedPayment = payment;
    this.showPaymentDetailModal = true;
  }

  closePaymentDetailModal(): void {
    this.showPaymentDetailModal = false;
    this.selectedPayment = null;
  }

  onRefundRequest(payment: PaymentDto): void {
    // Future implementation for refund functionality
    console.log('Refund requested for payment:', payment.id);
    // You can implement refund logic here
    // this.paymentService.requestRefund(payment.id, refundData).subscribe(...)
  }

  formatDate(date: Date | string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
