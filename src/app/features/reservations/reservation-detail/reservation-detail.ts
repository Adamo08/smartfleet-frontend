import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, switchMap, catchError, of } from 'rxjs';
import { ReservationService } from '../../../core/services/reservation.service';
import { PaymentService } from '../../../core/services/payment.service';
import { BookmarkService } from '../../../core/services/bookmark.service';
import { AuthService } from '../../../core/services/auth';
import { DetailedReservationDto } from '../../../core/models/reservation.interface';
import { PaymentDto } from '../../../core/models/payment.interface';
import { ReservationStatus } from '../../../core/enums/reservation-status.enum';

@Component({
  selector: 'app-reservation-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './reservation-detail.html',
  styleUrl: './reservation-detail.css'
})
export class ReservationDetail implements OnInit, OnDestroy {
  @Input() reservationId?: number;
  
  reservation: DetailedReservationDto | null = null;
  payment: PaymentDto | null = null;
  isBookmarked: boolean = false;
  loading: boolean = false;
  error: string | null = null;
  
  commentForm: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reservationService: ReservationService,
    private paymentService: PaymentService,
    private bookmarkService: BookmarkService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.commentForm = this.fb.group({
      comment: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.loadReservation();
    this.setupCommentForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadReservation(): void {
    this.loading = true;
    this.error = null;

    const id = this.reservationId || Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error = 'Reservation ID is required';
      this.loading = false;
      return;
    }

    // Always use user endpoint for viewing own reservations (both customers and admins)
    this.reservationService.getReservationById(id).pipe(
      takeUntil(this.destroy$),
      switchMap(reservation => {
        this.reservation = reservation;
        this.commentForm.patchValue({ comment: reservation.comment || '' });
        
        // Load payment information
        return this.paymentService.getPaymentByReservationId(reservation.id);
      }),
      catchError(error => {
        console.error('Error loading reservation:', error);
        this.error = 'Failed to load reservation details';
        return of(null);
      })
    ).subscribe(payment => {
      if (payment) {
        this.payment = payment;
      }
      
      // Check if reservation is bookmarked
      if (this.reservation) {
        this.checkBookmarkStatus();
      }
      
      this.loading = false;
    });
  }

  private setupCommentForm(): void {
    this.commentForm.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      // Auto-save comment after user stops typing
      // This could be implemented with debounceTime if needed
    });
  }

  private checkBookmarkStatus(): void {
    if (this.reservation) {
      this.bookmarkService.isReservationBookmarked(this.reservation.id).pipe(
        takeUntil(this.destroy$)
      ).subscribe(isBookmarked => {
        this.isBookmarked = isBookmarked;
      });
    }
  }

  onCancelReservation(): void {
    if (!this.reservation || !confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    this.loading = true;
    this.reservationService.cancelReservation(this.reservation.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (updatedReservation) => {
        this.reservation = updatedReservation;
        this.loading = false;
        // Show success message
      },
      error: (error) => {
        console.error('Error cancelling reservation:', error);
        this.error = 'Failed to cancel reservation';
        this.loading = false;
      }
    });
  }

  onToggleBookmark(): void {
    if (!this.reservation) return;

    this.bookmarkService.toggleBookmark(this.reservation.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.isBookmarked = !this.isBookmarked;
        // Show success message
      },
      error: (error) => {
        console.error('Error toggling bookmark:', error);
        // Show error message
      }
    });
  }

  onUpdateComment(): void {
    if (!this.reservation || !this.commentForm.valid) return;

    const comment = this.commentForm.get('comment')?.value;
    // This would require a backend endpoint to update comments
    // For now, we'll just show a message
    console.log('Comment updated:', comment);
  }

  onViewPayment(): void {
    if (this.payment) {
      this.router.navigate(['/payments', this.payment.id]);
    }
  }

  onRequestRefund(): void {
    if (!this.payment) return;
    
    this.router.navigate(['/payments/refund-request'], { 
      queryParams: { paymentId: this.payment.id } 
    });
  }

  onEditReservation(): void {
    if (this.reservation) {
      this.router.navigate(['/reservations/edit', this.reservation.id]);
    }
  }

  onBackToList(): void {
    this.router.navigate(['/reservations']);
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

  getPaymentStatusColor(status: string): string {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500';
      case 'PENDING':
        return 'bg-yellow-500';
      case 'FAILED':
        return 'bg-red-500';
      case 'REFUNDED':
        return 'bg-blue-500';
      case 'CANCELLED':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  }

  getPaymentStatusText(status: string): string {
    switch (status) {
      case 'COMPLETED':
        return 'Completed';
      case 'PENDING':
        return 'Pending';
      case 'FAILED':
        return 'Failed';
      case 'REFUNDED':
        return 'Refunded';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }

  canCancel(): boolean {
    return this.reservation?.status === ReservationStatus.PENDING || 
           this.reservation?.status === ReservationStatus.CONFIRMED;
  }

  canEdit(): boolean {
    return this.reservation?.status === ReservationStatus.PENDING;
  }

  canRequestRefund(): boolean {
    return this.payment?.status === 'COMPLETED';
  }

  getTotalDays(): number {
    if (!this.reservation) return 0;
    
    const start = new Date(this.reservation.startDate);
    const end = new Date(this.reservation.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getTotalAmount(): number {
    if (!this.reservation) return 0;
    
    // This would calculate based on vehicle price and duration
    // For now, return a placeholder
    return this.getTotalDays() * 100; // Assuming $100 per day
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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
}
