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
import { Pagination } from '../../../shared/components/pagination/pagination';
import { PaymentDto } from '../../../core/models/payment.interface';
import { PaymentStatus } from '../../../core/enums/payment-status.enum';
import { PaymentProcessingService } from '../../../core/services/payment-processing.service';
import { PaymentStateService } from '../../../core/services/payment-state.service';
import { BookmarkService } from '../../../core/services/bookmark.service';
import { ToastrService } from 'ngx-toastr';
import { Modal } from '../../../shared/components/modal/modal';

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, Pagination, Modal],
  templateUrl: './reservation-list.html',
  styleUrl: './reservation-list.css'
})
export class ReservationList implements OnInit, OnDestroy {
  reservationsPage!: Page<ReservationSummaryDto>;
  loading: boolean = false;
  error: string | null = null;
  
  // Pagination
  currentPage: number = 0;
  pageSize: number = 10;
  sortBy: string = 'createdAt';
  sortDirection: 'ASC' | 'DESC' = 'DESC';
  
  // Filtering
  filterForm: FormGroup;
  selectedStatus: ReservationStatus | '' = '';
  searchTerm: string = '';
  
  // Modal and payment handling
  selectedReservation: ReservationSummaryDto | null = null;
  selectedReservationPayment: PaymentDto | null = null;
  isViewModalOpen = false;
  reservationPayments = new Map<number, PaymentDto>();
  
  private destroy$ = new Subject<void>();

  constructor(
    private reservationService: ReservationService,
    private paymentProcessingService: PaymentProcessingService,
    private paymentStateService: PaymentStateService,
    private bookmarkService: BookmarkService,
    private router: Router,
    private fb: FormBuilder,
    private authService: AuthService,
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

  onCreateReservation(): void {
    this.router.navigate(['/reservations/create']);
  }

  getMaxPageElement(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.reservationsPage?.totalElements || 0);
  }

  onFilterReset(): void {
    this.filterForm.reset();
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
    this.currentPage = 0;
    this.loadReservations();
  }

  getSortIconClass(property: string): string {
    if (this.sortBy !== property) return 'text-gray-400';
    return this.sortDirection === 'ASC' ? 'text-blue-500' : 'text-blue-500';
  }

  getSortIcon(property: string): string {
    if (this.sortBy !== property) return 'M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4';
    return this.sortDirection === 'ASC' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7';
  }

  onReservationClick(reservation: ReservationSummaryDto): void {
    // Handle reservation click - could open a modal or navigate to detail page
    console.log('Reservation clicked:', reservation);
    // You can implement navigation or modal opening here
    // this.router.navigate(['/reservations', reservation.id]);
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

  getTotalDays(startDate: Date | string, endDate: Date | string): number {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getStatusColor(status: ReservationStatus): string {
    switch (status) {
      case ReservationStatus.CONFIRMED:
        return 'bg-green-500';
      case ReservationStatus.PENDING:
        return 'bg-yellow-500';
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
      case ReservationStatus.CONFIRMED:
        return 'Confirmed';
      case ReservationStatus.PENDING:
        return 'Pending';
      case ReservationStatus.CANCELLED:
        return 'Cancelled';
      case ReservationStatus.COMPLETED:
        return 'Completed';
      default:
        return 'Unknown';
    }
  }

  // View reservation modal
  onViewReservation(reservation: ReservationSummaryDto): void {
    this.selectedReservation = reservation;
    this.isViewModalOpen = true;
    this.loadReservationPayment(reservation.id);
  }

  closeViewModal(): void {
    this.isViewModalOpen = false;
    this.selectedReservation = null;
    this.selectedReservationPayment = null;
  }

  // Payment handling
  onPayReservation(reservation: ReservationSummaryDto): void {
    // Navigate to payment page or open payment modal
    this.router.navigate(['/payments', 'process'], { 
      queryParams: { reservationId: reservation.id } 
    });
  }

  // Cancel reservation
  onCancelReservation(reservation: ReservationSummaryDto): void {
    if (confirm('Are you sure you want to cancel this reservation?')) {
      this.reservationService.cancelReservation(reservation.id).subscribe({
        next: () => {
          this.toastr.success('Reservation cancelled successfully');
          this.loadReservations(); // Refresh the list
        },
        error: (error: any) => {
          console.error('Error cancelling reservation:', error);
          this.toastr.error('Failed to cancel reservation');
        }
      });
    }
  }

  // Bookmark handling
  onBookmarkReservation(reservation: ReservationSummaryDto): void {
    this.bookmarkService.toggleBookmark(reservation.id).subscribe({
      next: () => {
        this.toastr.success('Bookmark updated successfully');
        // Refresh the list to update bookmark status
        this.loadReservations();
      },
      error: (error: any) => {
        console.error('Error updating bookmark:', error);
        this.toastr.error('Failed to update bookmark');
      }
    });
  }

  // Helper methods for conditional display
  canPayReservation(reservation: ReservationSummaryDto): boolean {
    return reservation.status === ReservationStatus.CONFIRMED || 
           reservation.status === ReservationStatus.PENDING;
  }

  canCancelReservation(reservation: ReservationSummaryDto): boolean {
    return reservation.status === ReservationStatus.PENDING || 
           reservation.status === ReservationStatus.CONFIRMED;
  }

  isReservationBookmarked(reservationId: number): boolean {
    // This would need to be implemented based on the bookmark service
    // For now, return false as a placeholder
    return false;
  }

  // Payment information methods
  loadReservationPayment(reservationId: number): void {
    this.paymentProcessingService.getPaymentStatus(reservationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.success) {
            // Convert PaymentResult to PaymentDto format for compatibility
            const payment: PaymentDto = {
              id: 0, // Will be set from backend
              reservationId: reservationId,
              amount: 0, // Will be set from backend
              currency: 'USD',
              status: result.transactionId ? PaymentStatus.COMPLETED : PaymentStatus.PENDING,
              transactionId: result.transactionId,
              provider: 'Unknown',
              createdAt: new Date(),
              updatedAt: new Date()
            };
            this.reservationPayments.set(reservationId, payment);
            this.selectedReservationPayment = payment;
          }
        },
        error: (error: any) => {
          console.error('Error loading payment info:', error);
          // Set default payment info
          this.selectedReservationPayment = null;
        }
      });
  }

  getPaymentStatus(reservationId: number): string {
    const payment = this.reservationPayments.get(reservationId);
    return payment ? payment.status : 'No Payment';
  }

  getPaymentAmount(reservationId: number): number {
    const payment = this.reservationPayments.get(reservationId);
    return payment ? payment.amount : 0;
  }

  // Helper methods using shared services
  formatCurrency(amount: number): string {
    return this.paymentProcessingService.formatCurrency(amount, 'USD');
  }

  getDurationLabel(startDate: Date | string, endDate: Date | string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    return this.paymentProcessingService.getDurationLabel(diffHours);
  }

  // Enhanced payment handling using shared state
  onPayReservationEnhanced(reservation: ReservationSummaryDto): void {
    // Set up payment state
    const totalAmount = this.calculateReservationAmount(reservation);
    this.paymentStateService.setReservationForPayment(reservation.id, totalAmount, 'USD');
    
    // Navigate to payment page
    this.router.navigate(['/payments', 'process'], { 
      queryParams: { reservationId: reservation.id } 
    });
  }

  private calculateReservationAmount(reservation: ReservationSummaryDto): number {
    // This would need to be implemented based on your business logic
    // For now, return a placeholder amount
    return 100.0;
  }
}
