import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { PaymentService } from '../../../core/services/payment.service';
import { RefundDetailsDto } from '../../../core/models/payment.interface';
import { RefundStatus } from '../../../core/enums/refund-status.enum';
import { Page, Pageable } from '../../../core/models/pagination.interface';
import { Pagination } from '../../../shared/components/pagination/pagination';
import { Modal } from '../../../shared/components/modal/modal';

@Component({
  selector: 'app-refund-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, Pagination, Modal],
  templateUrl: './refund-list.html',
  styleUrl: './refund-list.css'
})
export class RefundList implements OnInit, OnDestroy {
  refundsPage!: Page<RefundDetailsDto>;
  loading = false;
  error: string | null = null;
  
  // Pagination
  currentPage = 0;
  pageSize = 10;
  sortBy = 'requestedAt';
  sortDirection: 'ASC' | 'DESC' = 'DESC';
  
  // Filtering
  filterForm: FormGroup;
  selectedStatus: RefundStatus | '' = '';
  searchTerm = '';
  
  // Modal state
  showRefundDetailModal = false;
  selectedRefund: RefundDetailsDto | null = null;
  
  private destroy$ = new Subject<void>();

  // Expose RefundStatus enum to template
  readonly RefundStatus = RefundStatus;
  readonly refundStatusValues = Object.values(RefundStatus);

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

    // Initialize refundsPage
    this.refundsPage = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: this.pageSize,
      number: this.currentPage,
      numberOfElements: 0,
      first: true,
      last: true,
      empty: true
    };
  }

  ngOnInit(): void {
    this.setupFilterListener();
    this.loadRefunds();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFilterListener(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 0;
        this.loadRefunds();
      });
  }

  private loadRefunds(): void {
    this.loading = true;
    this.error = null;

    const pageable: Pageable = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };

    // Get form values for filtering
    const formValues = this.filterForm.value;
    const filters = {
      status: formValues.status || undefined,
      searchTerm: formValues.searchTerm || undefined,
      startDate: formValues.startDate || undefined,
      endDate: formValues.endDate || undefined
    };

    this.paymentService.getRefundHistory(pageable, filters).subscribe({
      next: (page) => {
        this.refundsPage = page;
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

  onSortChange(column: string): void {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = column;
      this.sortDirection = 'ASC';
    }
    this.currentPage = 0;
    this.loadRefunds();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.currentPage = 0;
    this.loadRefunds();
  }

  openRefundDetailModal(refund: RefundDetailsDto): void {
    this.selectedRefund = refund;
    this.showRefundDetailModal = true;
  }

  closeRefundDetailModal(): void {
    this.showRefundDetailModal = false;
    this.selectedRefund = null;
  }

  getStatusBadgeClass(status: RefundStatus): string {
    switch (status) {
      case RefundStatus.PROCESSED:
        return 'bg-green-500';
      case RefundStatus.PENDING:
        return 'bg-yellow-500';
      case RefundStatus.FAILED:
        return 'bg-red-500';
      case RefundStatus.CANCELLED:
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  }

  getStatusText(status: RefundStatus): string {
    switch (status) {
      case RefundStatus.PROCESSED:
        return 'Processed';
      case RefundStatus.PENDING:
        return 'Pending';
      case RefundStatus.FAILED:
        return 'Failed';
      case RefundStatus.CANCELLED:
        return 'Cancelled';
      default:
        return status;
    }
  }

  formatCurrency(amount: number, currency?: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  }

  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
