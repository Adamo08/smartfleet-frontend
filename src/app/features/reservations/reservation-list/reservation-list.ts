import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { ReservationService } from '../../../core/services/reservation.service';
import { AuthService } from '../../../core/services/auth';
import { ReservationSummaryDto, ReservationFilter } from '../../../core/models/reservation.interface';
import { Pageable, Page } from '../../../core/models/pagination.interface';
import { ReservationStatus } from '../../../core/enums/reservation-status.enum';

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './reservation-list.html',
  styleUrl: './reservation-list.css'
})
export class ReservationList implements OnInit, OnDestroy {
  reservations: ReservationSummaryDto[] = [];
  loading: boolean = false;
  error: string | null = null;
  
  // Pagination
  currentPage: number = 0;
  pageSize: number = 10;
  totalElements: number = 0;
  totalPages: number = 0;
  
  // Filtering
  filterForm: FormGroup;
  selectedStatus: ReservationStatus | '' = '';
  searchTerm: string = '';
  
  // Sorting
  sortBy: string = 'createdAt';
  sortDirection: 'ASC' | 'DESC' = 'DESC';
  
  private destroy$ = new Subject<void>();

  constructor(
    private reservationService: ReservationService,
    private router: Router,
    private fb: FormBuilder,
    private authService: AuthService
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
    this.loadReservations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFilterListener(): void {
    this.filterForm.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 0;
      this.loadReservations();
    });
  }

  private loadReservations(): void {
    this.loading = true;
    this.error = null;

    const filter: ReservationFilter = {
      status: this.filterForm.get('status')?.value || undefined,
      startDate: this.filterForm.get('startDate')?.value || undefined,
      endDate: this.filterForm.get('endDate')?.value || undefined
    };

    const pageable: Pageable = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };

    // Always load user's own reservations (both customers and admins)
    this.reservationService.getReservationsForCurrentUser(pageable).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (page: Page<ReservationSummaryDto>) => {
        this.reservations = page.content;
        this.totalElements = page.totalElements;
        this.totalPages = page.totalPages;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading reservations:', error);
        this.error = 'Failed to load reservations';
        this.loading = false;
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadReservations();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 0;
    this.loadReservations();
  }

  onSort(property: string): void {
    if (this.sortBy === property) {
      this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = property;
      this.sortDirection = 'ASC';
    }
    this.loadReservations();
  }

  onFilterReset(): void {
    this.filterForm.reset();
    this.currentPage = 0;
    this.loadReservations();
  }

  onReservationClick(reservation: ReservationSummaryDto): void {
    this.router.navigate(['/reservations', reservation.id]);
  }

  onCreateReservation(): void {
    this.router.navigate(['/reservations/create']);
  }

  getStatusColor(status: ReservationStatus): string {
    switch (status) {
      case ReservationStatus.PENDING:
        return 'bg-yellow-500';
      case ReservationStatus.CONFIRMED:
        return 'bg-green-500';
      case ReservationStatus.CANCELLED:
        return 'bg-red-500';
      case ReservationStatus.COMPLETED:
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  }

  getStatusText(status: ReservationStatus): string {
    switch (status) {
      case ReservationStatus.PENDING:
        return 'Pending';
      case ReservationStatus.CONFIRMED:
        return 'Confirmed';
      case ReservationStatus.CANCELLED:
        return 'Cancelled';
      case ReservationStatus.COMPLETED:
        return 'Completed';
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

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getTotalDays(startDate: Date | string, endDate: Date | string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 0; i < this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(0, this.currentPage - Math.floor(maxVisiblePages / 2));
      const endPage = Math.min(this.totalPages - 1, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  canGoToPage(page: number): boolean {
    return page >= 0 && page < this.totalPages;
  }

  getSortIcon(property: string): string {
    if (this.sortBy !== property) {
      return 'M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4';
    }
    
    return this.sortDirection === 'ASC' 
      ? 'M5 15l7-7 7 7' 
      : 'M19 9l-7 7-7-7';
  }

  getSortIconClass(property: string): string {
    if (this.sortBy !== property) {
      return 'text-gray-400';
    }
    
    return this.sortDirection === 'ASC' ? 'text-indigo-400' : 'text-indigo-400 rotate-180';
  }

  getMaxPageElement(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }
}
