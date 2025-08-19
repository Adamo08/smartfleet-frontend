import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { PaymentService } from '../../../core/services/payment.service';
import { PaymentDto } from '../../../core/models/payment.interface';
import { Pageable, Page } from '../../../core/models/pagination.interface';
import { PaymentStatus } from '../../../core/enums/payment-status.enum';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './payment-history.html',
  styleUrl: './payment-history.css'
})
export class PaymentHistory implements OnInit, OnDestroy {
  // Helper for template page info
  getMaxPageElement(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }
  payments: PaymentDto[] = [];
  loading: boolean = false;
  error: string | null = null;

  // Pagination
  currentPage: number = 0;
  pageSize: number = 10;
  totalElements: number = 0;
  totalPages: number = 0;

  // Filtering
  filterForm: FormGroup;
  selectedStatus: PaymentStatus | '' = '';
  searchTerm: string = '';

  // Sorting
  sortBy: string = 'createdAt';
  sortDirection: 'ASC' | 'DESC' = 'DESC';

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
    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 0;
      this.loadPayments();
    });
  }

  private loadPayments(): void {
    this.loading = true;
    this.error = null;

    const pageable: Pageable = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };

    this.paymentService.getPaymentHistory(pageable).subscribe({
      next: (response: Page<PaymentDto>) => {
        this.payments = response.content;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.currentPage = response.number;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading payments:', error);
        this.error = 'Failed to load payment history';
        this.loading = false;
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadPayments();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
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
    this.loadPayments();
  }

  onFilterReset(): void {
    this.filterForm.reset();
    this.currentPage = 0;
    this.loadPayments();
  }

  onPaymentClick(payment: PaymentDto): void {
    // Navigate to payment details or open modal
    console.log('Payment clicked:', payment);
  }

  getStatusColor(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return 'bg-green-500';
      case PaymentStatus.PENDING:
        return 'bg-yellow-500';
      case PaymentStatus.FAILED:
        return 'bg-red-500';
      case PaymentStatus.REFUNDED:
        return 'bg-blue-500';
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
      case PaymentStatus.REFUNDED:
        return 'Refunded';
      case PaymentStatus.CANCELLED:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(0, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages - 1, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  canGoToPage(page: number): boolean {
    return page >= 0 && page < this.totalPages;
  }

  getSortIcon(property: string): string {
    if (this.sortBy !== property) {
      return '↕';
    }
    return this.sortDirection === 'ASC' ? '↑' : '↓';
  }

  getSortIconClass(property: string): string {
    if (this.sortBy !== property) {
      return 'text-gray-400';
    }
    return this.sortDirection === 'ASC' ? 'text-indigo-400' : 'text-indigo-400';
  }
}
