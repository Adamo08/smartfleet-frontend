import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { PaymentService } from './payment.service';
import { Pageable } from '../models/pagination.interface';

@Injectable({
  providedIn: 'root'
})
export class RefundCountService {
  private pendingCountSubject = new BehaviorSubject<number>(0);
  public pendingCount$ = this.pendingCountSubject.asObservable();

  constructor(private paymentService: PaymentService) {}

  /**
   * Load the current pending refund count from the server
   */
  loadPendingRefundCount(): void {
    const pageable: Pageable = { page: 0, size: 1, sortBy: 'requestedAt', sortDirection: 'DESC' };
    
    this.paymentService.getRefundRequests(pageable).subscribe({
      next: (response) => {
        this.pendingCountSubject.next(response.totalElements);
      },
      error: (error) => {
        console.error('Error loading pending refund count:', error);
      }
    });
  }

  /**
   * Manually update the pending refund count (e.g., after processing a refund)
   */
  updatePendingRefundCount(count: number): void {
    this.pendingCountSubject.next(count);
  }

  /**
   * Decrement the pending refund count (e.g., after approving/declining a refund)
   */
  decrementPendingRefundCount(): void {
    const currentCount = this.pendingCountSubject.value;
    if (currentCount > 0) {
      this.pendingCountSubject.next(currentCount - 1);
    }
  }

  /**
   * Get the current pending refund count value
   */
  getCurrentPendingCount(): number {
    return this.pendingCountSubject.value;
  }
}
