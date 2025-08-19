import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ReservationService } from '../../../core/services/reservation.service';
import { AdminAuditService } from '../../../core/services/admin-audit.service';
import { AdminConfirmationService } from '../../../core/services/admin-confirmation.service';
import { 
  ReservationSummaryDto, 
  ReservationFilter,
  AdminReservationUpdateRequest
} from '../../../core/models/reservation.interface';
import { Page, Pageable } from '../../../core/models/pagination.interface';
import { ReservationStatus } from '../../../core/enums/reservation-status.enum';

@Component({
  selector: 'app-reservation-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reservation-management.html',
  styleUrl: './reservation-management.css'
})
export class ReservationManagement implements OnInit, OnDestroy {
  // Math reference for template
  Math = Math;
  
  reservations: ReservationSummaryDto[] = [];
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  isLoading = false;
  errorMessage = '';

  // Filter form
  filterForm: FormGroup;
  
  // Status options
  statusOptions = Object.values(ReservationStatus);
  
  // Bulk operations
  selectedReservations: Set<number> = new Set();
  selectAll = false;

  // Sorting
  sortBy = 'createdAt';
  sortDirection: 'ASC' | 'DESC' = 'DESC';

  private destroy$ = new Subject<void>();

  constructor(
    private reservationService: ReservationService,
    private adminAuditService: AdminAuditService,
    private adminConfirmationService: AdminConfirmationService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.filterForm = this.fb.group({
      userId: [''],
      vehicleId: [''],
      status: [''],
      startDate: [''],
      endDate: ['']
    });
  }

  ngOnInit(): void {
    this.loadReservations();
    this.setupFilterListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFilterListener(): void {
    this.filterForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.currentPage = 0;
        this.loadReservations();
      });
  }

  private loadReservations(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const filter: ReservationFilter = this.filterForm.value;
    const pageable: Pageable = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };

    this.reservationService.getAllReservations(filter, pageable)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (page: Page<ReservationSummaryDto>) => {
          this.reservations = page.content;
          this.totalElements = page.totalElements;
          this.totalPages = page.totalPages;
          this.currentPage = page.number;
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = 'Failed to load reservations';
          console.error('Error loading reservations:', error);
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

  onStatusUpdate(reservationId: number, newStatus: ReservationStatus): void {
    const reservation = this.reservations.find(r => r.id === reservationId);
    if (!reservation) return;

    this.adminConfirmationService.confirmStatusUpdate(
      'Reservation',
      reservationId,
      reservation.status,
      newStatus
    ).pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result.confirmed) {
        const request: AdminReservationUpdateRequest = { status: newStatus };
        
        this.reservationService.updateReservationStatus(reservationId, request)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (updatedReservation) => {
              // Update the reservation in the list
              const index = this.reservations.findIndex(r => r.id === reservationId);
              if (index !== -1) {
                this.reservations[index] = updatedReservation;
              }
              
              // Remove from selected if it was selected
              this.selectedReservations.delete(reservationId);

              // Log admin action
              this.adminAuditService.logAction({
                action: 'UPDATE_STATUS',
                resource: 'RESERVATION',
                resourceId: reservationId,
                details: `Status changed to ${newStatus}${result.reason ? ` - Reason: ${result.reason}` : ''}`
              }).subscribe();
            },
            error: (error) => {
              console.error('Error updating reservation status:', error);
              this.errorMessage = 'Failed to update reservation status';
            }
          });
      }
    });
  }

  onDeleteReservation(reservationId: number): void {
    this.adminConfirmationService.confirmDangerousAction(
      'delete',
      'Reservation',
      reservationId
    ).pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result.confirmed) {
        this.reservationService.deleteReservation(reservationId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              // Remove from the list
              this.reservations = this.reservations.filter(r => r.id !== reservationId);
              this.selectedReservations.delete(reservationId);
              this.totalElements--;

              // Log admin action
              this.adminAuditService.logAction({
                action: 'DELETE',
                resource: 'RESERVATION',
                resourceId: reservationId,
                details: `Reservation deleted${result.reason ? ` - Reason: ${result.reason}` : ''}`
              }).subscribe();
            },
            error: (error) => {
              console.error('Error deleting reservation:', error);
              this.errorMessage = 'Failed to delete reservation';
            }
          });
      }
    });
  }

  // Bulk operations
  onSelectAll(checked: boolean): void {
    this.selectAll = checked;
    if (checked) {
      this.reservations.forEach(r => this.selectedReservations.add(r.id));
    } else {
      this.selectedReservations.clear();
    }
  }

  onSelectReservation(reservationId: number, checked: boolean): void {
    if (checked) {
      this.selectedReservations.add(reservationId);
    } else {
      this.selectedReservations.delete(reservationId);
    }
    
    // Update select all checkbox
    this.selectAll = this.selectedReservations.size === this.reservations.length;
  }

  onBulkStatusUpdate(newStatus: ReservationStatus): void {
    if (this.selectedReservations.size === 0) {
      alert('Please select at least one reservation');
      return;
    }

    if (confirm(`Are you sure you want to update ${this.selectedReservations.size} reservation(s) to ${newStatus}?`)) {
      const promises = Array.from(this.selectedReservations).map(id =>
        this.reservationService.updateReservationStatus(id, { status: newStatus }).toPromise()
      );

      Promise.all(promises)
        .then(() => {
          this.loadReservations();
          this.selectedReservations.clear();
          this.selectAll = false;
        })
        .catch((error) => {
          console.error('Error in bulk status update:', error);
          this.errorMessage = 'Some reservations failed to update';
        });
    }
  }

  // Helper for template to safely convert string to ReservationStatus
  onBulkStatusUpdateFromUI(value: string): void {
    if (!value) return;
    const status = value as unknown as ReservationStatus;
    this.onBulkStatusUpdate(status);
  }

  onBulkDelete(): void {
    if (this.selectedReservations.size === 0) {
      alert('Please select at least one reservation');
      return;
    }

    if (confirm(`Are you sure you want to delete ${this.selectedReservations.size} reservation(s)? This action cannot be undone.`)) {
      const promises = Array.from(this.selectedReservations).map(id =>
        this.reservationService.deleteReservation(id).toPromise()
      );

      Promise.all(promises)
        .then(() => {
          this.loadReservations();
          this.selectedReservations.clear();
          this.selectAll = false;
        })
        .catch((error) => {
          console.error('Error in bulk delete:', error);
          this.errorMessage = 'Some reservations failed to delete';
        });
    }
  }

  // Export functionality
  onExportCSV(): void {
    if (this.reservations.length === 0) {
      alert('No reservations to export');
      return;
    }

    const headers = ['ID', 'Vehicle', 'Start Date', 'End Date', 'Status', 'User'];
    const csvContent = [
      headers.join(','),
      ...this.reservations.map(r => [
        r.id,
        `${r.vehicle.brand} ${r.vehicle.model}`,
        new Date(r.startDate).toLocaleDateString(),
        new Date(r.endDate).toLocaleDateString(),
        r.status,
        'N/A' // User info not available in summary
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reservations_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Helper methods for template
  getStatusClass(status: ReservationStatus): string {
    switch (status) {
      case ReservationStatus.PENDING: return 'status-pending';
      case ReservationStatus.CONFIRMED: return 'status-confirmed';
      case ReservationStatus.COMPLETED: return 'status-completed';
      case ReservationStatus.CANCELLED: return 'status-cancelled';
      default: return 'status-default';
    }
  }

  getStatusIcon(status: ReservationStatus): string {
    switch (status) {
      case ReservationStatus.PENDING: return '⏳';
      case ReservationStatus.CONFIRMED: return '✅';
      case ReservationStatus.COMPLETED: return '🎉';
      case ReservationStatus.CANCELLED: return '❌';
      default: return '❓';
    }
  }

  canUpdateStatus(currentStatus: ReservationStatus): boolean {
    return currentStatus === ReservationStatus.PENDING || 
           currentStatus === ReservationStatus.CONFIRMED;
  }

  canDeleteStatus(currentStatus: ReservationStatus): boolean {
    return currentStatus === ReservationStatus.CANCELLED || 
           currentStatus === ReservationStatus.COMPLETED;
  }

  getSelectedCount(): number {
    return this.selectedReservations.size;
  }

  hasSelectedReservations(): boolean {
    return this.selectedReservations.size > 0;
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 0; i < this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(0, this.currentPage - Math.floor(maxVisiblePages / 2));
      const end = Math.min(this.totalPages - 1, start + maxVisiblePages - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  // Methods needed by the template
  getStatusColor(status: ReservationStatus): string {
    switch (status) {
      case ReservationStatus.PENDING: return 'bg-yellow-500';
      case ReservationStatus.CONFIRMED: return 'bg-green-500';
      case ReservationStatus.COMPLETED: return 'bg-blue-500';
      case ReservationStatus.CANCELLED: return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }

  getStatusText(status: ReservationStatus): string {
    switch (status) {
      case ReservationStatus.PENDING: return 'Pending';
      case ReservationStatus.CONFIRMED: return 'Confirmed';
      case ReservationStatus.COMPLETED: return 'Completed';
      case ReservationStatus.CANCELLED: return 'Cancelled';
      default: return 'Unknown';
    }
  }

  isSelected(reservationId: number): boolean {
    return this.selectedReservations.has(reservationId);
  }

  isAllSelected(): boolean {
    return this.selectedReservations.size > 0 && this.selectedReservations.size === this.reservations.length;
  }

  getMaxPageElement(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  // Methods needed by the template
  onViewReservation(reservationId: number): void {
    // Navigate to reservation detail page
    this.router.navigate(['/reservations', reservationId]);
  }

  onEditReservation(reservationId: number): void {
    // Navigate to edit reservation page
    this.router.navigate(['/reservations/edit', reservationId]);
  }
}
