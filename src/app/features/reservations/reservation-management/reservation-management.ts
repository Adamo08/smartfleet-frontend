import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, forkJoin } from 'rxjs';
import { ReservationService } from '../../../core/services/reservation.service';
import { ReservationSummaryDto, ReservationFilter } from '../../../core/models/reservation.interface';
import { Page, Pageable } from '../../../core/models/pagination.interface';
import { ReservationStatus } from '../../../core/enums/reservation-status.enum';
import { Pagination } from '../../../shared/components/pagination/pagination';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-reservation-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Pagination],
  templateUrl: './reservation-management.html',
  styleUrl: './reservation-management.css'
})
export class ReservationManagement implements OnInit, OnDestroy {
  reservationsPage!: Page<ReservationSummaryDto>;
  loading = false;
  error: string | null = null;
  
  // Pagination
  currentPage = 0;
  pageSize = 10;
  sortBy = 'createdAt';
  sortDirection: 'ASC' | 'DESC' = 'DESC';
  
  // Filtering
  filterForm: FormGroup;
  selectedStatus: ReservationStatus | '' = '';
  searchTerm = '';
  
  private destroy$ = new Subject<void>();

  constructor(
    private reservationService: ReservationService,
    private fb: FormBuilder,
    private router: Router,
    private toastr: ToastrService
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
    this.filterForm.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 0;
        this.loadReservations();
      });
  }

  loadReservations(): void {
    this.loading = true;
    this.error = null;

    const pageable: Pageable = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };

    const filter: ReservationFilter = {
      status: this.filterForm.value.status || undefined,
      startDate: this.filterForm.value.startDate ? new Date(this.filterForm.value.startDate) : undefined,
      endDate: this.filterForm.value.endDate ? new Date(this.filterForm.value.endDate) : undefined,
      searchTerm: this.filterForm.value.searchTerm || undefined
    };

    // Use the filtered endpoint for better search capabilities
    this.reservationService.getUserReservationsWithFilter(filter, pageable).subscribe({
      next: (page) => {
        this.reservationsPage = page;
        this.currentPage = page.number;
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

  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 0;
    this.loadReservations();
  }

  // Helper for template page info
  getMaxPageElement(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.reservationsPage?.totalElements || 0);
  }

  // Methods needed by the template
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

  hasSelectedReservations(): boolean {
    return this.selectedReservations.size > 0;
  }

  // Additional properties and methods needed by the template
  errorMessage: string | null = null;
  statusOptions = Object.values(ReservationStatus);
  selectedReservations = new Set<number>();

  onFilterReset(): void {
    this.filterForm.reset();
    this.currentPage = 0;
    this.loadReservations();
  }

  getSelectedCount(): number {
    return this.selectedReservations.size;
  }

  onBulkStatusUpdateFromUI(statusString: string): void {
    if (this.selectedReservations.size === 0) {
      this.errorMessage = 'Please select at least one reservation to update';
      return;
    }

    // Convert string to ReservationStatus enum
    const status = statusString as ReservationStatus;
    if (!Object.values(ReservationStatus).includes(status)) {
      this.errorMessage = 'Invalid status selected';
      return;
    }

    const reservationIds = Array.from(this.selectedReservations);
    this.loading = true;
    this.errorMessage = null;

    // Update each selected reservation
    const updateObservables = reservationIds.map(id => 
      this.reservationService.updateReservationStatus(id, { status })
    );

    forkJoin(updateObservables).subscribe({
      next: () => {
        this.toastr.success(`Successfully updated ${reservationIds.length} reservation(s) to ${status}`);
        this.selectedReservations.clear();
        this.loadReservations();
      },
      error: (error) => {
        console.error('Error updating reservations:', error);
        this.errorMessage = 'Failed to update some reservations';
        this.loading = false;
      }
    });
  }

  onBulkDelete(): void {
    if (this.selectedReservations.size === 0) {
      this.errorMessage = 'Please select at least one reservation to delete';
      return;
    }

    if (confirm(`Are you sure you want to delete ${this.selectedReservations.size} reservation(s)?`)) {
      const reservationIds = Array.from(this.selectedReservations);
      this.loading = true;
      this.errorMessage = null;

      // Delete each selected reservation
      const deleteObservables = reservationIds.map(id => 
        this.reservationService.deleteReservation(id)
      );

      forkJoin(deleteObservables).subscribe({
        next: () => {
          this.toastr.success(`Successfully deleted ${reservationIds.length} reservation(s)`);
          this.selectedReservations.clear();
          this.loadReservations();
        },
        error: (error) => {
          console.error('Error deleting reservations:', error);
          this.errorMessage = 'Failed to delete some reservations';
          this.loading = false;
        }
      });
    }
  }

  isAllSelected(): boolean {
    return this.reservationsPage?.content?.length > 0 && 
           this.selectedReservations.size === this.reservationsPage.content.length;
  }

  onSelectAll(checked: boolean): void {
    if (checked) {
      this.reservationsPage?.content?.forEach(reservation => {
        this.selectedReservations.add(reservation.id);
      });
    } else {
      this.selectedReservations.clear();
    }
  }

  isSelected(id: number): boolean {
    return this.selectedReservations.has(id);
  }

  onSelectReservation(id: number, checked: boolean): void {
    if (checked) {
      this.selectedReservations.add(id);
    } else {
      this.selectedReservations.delete(id);
    }
  }

  onViewReservation(id: number): void {
    const reservation = this.reservationsPage?.content?.find(r => r.id === id);
    if (reservation) {
      // Open reservation detail modal or navigate to detail page
      this.router.navigate(['/reservations', id]);
    }
  }

  onEditReservation(id: number): void {
    const reservation = this.reservationsPage?.content?.find(r => r.id === id);
    if (reservation) {
      // Navigate to edit page or open edit modal
      this.router.navigate(['/reservations', id, 'edit']);
    }
  }

  onDeleteReservation(id: number): void {
    if (confirm('Are you sure you want to delete this reservation?')) {
      this.loading = true;
      this.errorMessage = null;

      this.reservationService.deleteReservation(id).subscribe({
        next: () => {
          this.toastr.success('Reservation deleted successfully');
          this.loadReservations();
        },
        error: (error) => {
          console.error('Error deleting reservation:', error);
          this.errorMessage = 'Failed to delete reservation';
          this.loading = false;
        }
      });
    }
  }
}
