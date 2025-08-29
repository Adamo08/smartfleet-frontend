import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { PaymentService } from '../../../../core/services/payment.service';
import { RefundDetailsDto } from '../../../../core/models/payment.interface';
import { Page, Pageable } from '../../../../core/models/pagination.interface';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { Modal } from '../../../../shared/components/modal/modal';

@Component({
  selector: 'app-refund-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Pagination, Modal],
  templateUrl: './refund-list.html',
  styleUrl: './refund-list.css'
})
export class RefundList implements OnInit, OnDestroy {
  refundsPage!: Page<RefundDetailsDto>;
  filterForm: FormGroup;
  isLoading = false;
  error: string | null = null;

  currentPage = 0;
  pageSize = 10;
  sortBy = 'id';
  sortDirection: 'ASC' | 'DESC' = 'DESC';

  selectedRefund: RefundDetailsDto | null = null;
  showRefundDetailModal = false;

  private destroy$ = new Subject<void>();

  constructor(
    private paymentService: PaymentService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      paymentId: [null],
      status: [''],
      minAmount: [null],
      maxAmount: [null],
      startDate: [null],
      endDate: [null],
      searchTerm: ['']
    });

    this.refundsPage = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: this.pageSize,
      numberOfElements: 0,
      first: true,
      last: true,
      empty: true
    } as Page<RefundDetailsDto>;
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
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 0;
        this.loadRefunds();
      });
  }

  loadRefunds(): void {
    this.isLoading = true;
    this.error = null;

    const filters = this.filterForm.value;
    const pageable: Pageable = {
      page: this.currentPage,
      size: this.pageSize,
      sort: `${this.sortBy},${this.sortDirection}`
    } as Pageable;

    this.paymentService.getRefundHistory(pageable, filters).subscribe({
      next: (res: Page<RefundDetailsDto>) => {
        this.refundsPage = res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading refunds:', err);
        this.error = 'Failed to load refunds. Please try again.';
        this.isLoading = false;
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
      this.sortDirection = 'DESC';
    }
    this.loadRefunds();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.currentPage = 0;
  }

  viewRefund(refund: RefundDetailsDto): void {
    this.selectedRefund = refund;
    this.showRefundDetailModal = true;
  }

  closeRefundDetailModal(): void {
    this.showRefundDetailModal = false;
    this.selectedRefund = null;
  }

  getStatusBadgeClass(status: string): string {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
      case 'SUCCESS':
        return 'bg-green-500/20 text-green-400';
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'FAILED':
      case 'REJECTED':
        return 'bg-red-500/20 text-red-400';
      case 'PROCESSING':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}
