import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  Payment,
  PaymentDto,
  PaymentRequestDto,
  PaymentResponseDto,
  SessionRequestDto,
  SessionResponseDto,
  RefundRequestDto,
  RefundResponseDto,
  RefundDetailsDto,
  PaymentDetailsDto
} from '../models/payment.interface';
import { Page, Pageable } from '../models/pagination.interface';

export interface PaymentFilter {
  userId?: number;
  reservationId?: number;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly baseUrl = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  /**
   * Process a payment for a reservation
   */
  processPayment(request: PaymentRequestDto): Observable<PaymentResponseDto> {
    return this.http.post<PaymentResponseDto>(`${this.baseUrl}/process`, request);
  }

  /**
   * Get payment details by ID
   */
  getPaymentById(id: number): Observable<PaymentDto> {
    return this.http.get<PaymentDto>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get payment details by reservation ID
   */
  getPaymentByReservationId(reservationId: number): Observable<PaymentDto> {
    return this.http.get<PaymentDto>(`${this.baseUrl}/reservation/${reservationId}`);
  }

  /**
   * Get payment history for the current user
   */
  getPaymentHistory(pageable: Pageable): Observable<Page<PaymentDto>> {
    let params = new HttpParams()
      .set('page', pageable.page.toString())
      .set('size', pageable.size.toString());
    
    if (pageable.sortBy) {
      params = params.set('sortBy', pageable.sortBy);
    }
    if (pageable.sortDirection) {
      params = params.set('sortDirection', pageable.sortDirection);
    }

    return this.http.get<Page<PaymentDto>>(`${this.baseUrl}/history`, { params });
  }

  /**
   * Get filtered payment history for the current user
   */
  getUserPaymentHistoryWithFilter(filter: PaymentFilter, pageable: Pageable): Observable<Page<PaymentDto>> {
    let params = new HttpParams()
      .set('page', pageable.page.toString())
      .set('size', pageable.size.toString())
      .set('sortBy', pageable.sortBy || 'createdAt')
      .set('sortDirection', pageable.sortDirection || 'DESC');

    if (filter.status) {
      params = params.set('status', filter.status);
    }
    if (filter.minAmount) {
      params = params.set('minAmount', filter.minAmount.toString());
    }
    if (filter.maxAmount) {
      params = params.set('maxAmount', filter.maxAmount.toString());
    }
    if (filter.startDate) {
      params = params.set('startDate', filter.startDate.toISOString());
    }
    if (filter.endDate) {
      params = params.set('endDate', filter.endDate.toISOString());
    }
    if (filter.searchTerm && filter.searchTerm.trim() !== '') {
      params = params.set('searchTerm', filter.searchTerm.trim());
    }

    return this.http.get<Page<PaymentDto>>(`${this.baseUrl}/history/filtered`, { params });
  }

  /**
   * Create a payment session (for redirect-based payments like PayPal)
   */
  createPaymentSession(request: SessionRequestDto): Observable<SessionResponseDto> {
    return this.http.post<SessionResponseDto>(`${this.baseUrl}/session`, request).pipe(
      // normalize property name to redirectUrl expected by UI components
      // eslint-disable-next-line rxjs/no-explicit-generics
      (source) => new Observable<SessionResponseDto>(subscriber => {
        const sub = source.subscribe({
          next: (res: any) => subscriber.next({ sessionId: res.sessionId, redirectUrl: res.checkoutUrl || res.redirectUrl }),
          error: e => subscriber.error(e),
          complete: () => subscriber.complete()
        });
        return () => sub.unsubscribe();
      })
    );
  }

  /**
   * Confirm a payment after redirect
   */
  confirmPayment(sessionId: string): Observable<PaymentResponseDto> {
    return this.http.post<PaymentResponseDto>(`${this.baseUrl}/confirm/${sessionId}`, {});
  }

  /**
   * Cancel a payment
   */
  cancelPayment(paymentId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${paymentId}/cancel`, {});
  }

  /**
   * Request a refund
   */
  requestRefund(request: RefundRequestDto): Observable<RefundResponseDto> {
    return this.http.post<RefundResponseDto>(`${this.baseUrl}/refund`, request);
  }

  /**
   * Get refund details
   */
  getRefundDetails(refundId: number): Observable<RefundDetailsDto> {
    return this.http.get<RefundDetailsDto>(`${this.baseUrl}/refund/${refundId}`);
  }

  /**
   * Get refund history for the current user
   */
  getRefundHistory(pageable: Pageable): Observable<Page<RefundDetailsDto>> {
    let params = new HttpParams()
      .set('page', pageable.page.toString())
      .set('size', pageable.size.toString());
    
    if (pageable.sortBy) {
      params = params.set('sortBy', pageable.sortBy);
    }
    if (pageable.sortDirection) {
      params = params.set('sortDirection', pageable.sortDirection);
    }

    return this.http.get<Page<RefundDetailsDto>>(`${this.baseUrl}/refunds`, { params });
  }

  /**
   * ADMIN: Get all payments with pagination
   */
  getAllPaymentsAdmin(filter: PaymentFilter, pageable: Pageable): Observable<Page<PaymentDetailsDto>> {
    let params = new HttpParams()
      .set('page', pageable.page.toString())
      .set('size', pageable.size.toString())
      .set('sortBy', pageable.sortBy || 'id')
      .set('sortDirection', pageable.sortDirection || 'DESC');

    if (filter.userId) {
      params = params.set('userId', filter.userId.toString());
    }
    if (filter.reservationId) {
      params = params.set('reservationId', filter.reservationId.toString());
    }
    if (filter.status) {
      params = params.set('status', filter.status);
    }
    if (filter.minAmount) {
      params = params.set('minAmount', filter.minAmount.toString());
    }
    if (filter.maxAmount) {
      params = params.set('maxAmount', filter.maxAmount.toString());
    }
    if (filter.startDate) {
      params = params.set('startDate', filter.startDate.toISOString());
    }
    if (filter.endDate) {
      params = params.set('endDate', filter.endDate.toISOString());
    }
    if (filter.searchTerm && filter.searchTerm.trim() !== '') {
      params = params.set('searchTerm', filter.searchTerm.trim());
    }

    return this.http.get<Page<PaymentDetailsDto>>(`${this.baseUrl}/admin`, { params });
  }

  /**
   * Delete a payment (Admin only)
   */
  deletePayment(paymentId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/admin/${paymentId}`);
  }

  /**
   * ADMIN: Get payment details by ID
   */
  getPaymentDetailsAdmin(paymentId: number): Observable<PaymentDetailsDto> {
    return this.http.get<PaymentDetailsDto>(`${environment.apiUrl}/admin/payments/${paymentId}`);
  }

  /**
   * ADMIN: Manually trigger a refund for a payment
   */
  manualRefundAdmin(request: RefundRequestDto): Observable<RefundResponseDto> {
    return this.http.post<RefundResponseDto>(`${environment.apiUrl}/admin/payments/refund`, request);
  }

  /**
   * ADMIN: Get refunds for a given payment
   */
  getRefundsForPaymentAdmin(paymentId: number): Observable<RefundDetailsDto[]> {
    return this.http.get<RefundDetailsDto[]>(`${environment.apiUrl}/admin/payments/${paymentId}/refunds`);
  }
  /**
   * Get payment statistics for the current user
   */
  getPaymentStats(): Observable<{
    totalPayments: number;
    totalAmount: number;
    pendingPayments: number;
    completedPayments: number;
    failedPayments: number;
  }> {
    return this.http.get<any>(`${this.baseUrl}/stats`);
  }

  /**
   * Get available payment methods
   */
  getPaymentMethods(): Observable<{
    methods: Array<{
      id: string;
      name: string;
      description: string;
      icon: string;
      isActive: boolean;
    }>;
  }> {
    return this.http.get<any>(`${this.baseUrl}/methods`);
  }

  /**
   * Validate payment method
   */
  validatePaymentMethod(methodId: string): Observable<{
    isValid: boolean;
    message?: string;
  }> {
    return this.http.get<any>(`${this.baseUrl}/methods/${methodId}/validate`);
  }
}
