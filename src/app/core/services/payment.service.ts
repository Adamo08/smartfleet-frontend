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
  RefundDetailsDto
} from '../models/payment.interface';
import { Page, Pageable } from '../models/pagination.interface';

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
