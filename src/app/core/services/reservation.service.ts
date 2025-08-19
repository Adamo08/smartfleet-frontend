import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  Reservation,
  ReservationDto,
  DetailedReservationDto,
  ReservationSummaryDto,
  CreateReservationRequest,
  ReservationFilter,
  AdminReservationUpdateRequest
} from '../models/reservation.interface';
import { SlotDto } from '../models/slot.interface';
import { Page, Pageable } from '../models/pagination.interface';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private readonly baseUrl = `${environment.apiUrl}/reservations`;

  constructor(private http: HttpClient) {}

  /**
   * Create a new reservation for the current user
   */
  createReservation(request: CreateReservationRequest): Observable<DetailedReservationDto> {
    return this.http.post<DetailedReservationDto>(this.baseUrl, request);
  }

  /**
   * Get reservations for the current user with pagination
   */
  getReservationsForCurrentUser(pageable: Pageable): Observable<Page<ReservationSummaryDto>> {
    let params = new HttpParams()
      .set('page', pageable.page.toString())
      .set('size', pageable.size.toString());
    
    if (pageable.sortBy) {
      params = params.set('sortBy', pageable.sortBy);
    }
    if (pageable.sortDirection) {
      params = params.set('sortDirection', pageable.sortDirection);
    }

    return this.http.get<Page<ReservationSummaryDto>>(this.baseUrl, { params });
  }

  /**
   * Get a single reservation by ID for the current user
   */
  getReservationById(id: number): Observable<DetailedReservationDto> {
    return this.http.get<DetailedReservationDto>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get a single reservation by ID (Admin)
   */
  getReservationByIdAdmin(id: number): Observable<DetailedReservationDto> {
    return this.http.get<DetailedReservationDto>(`${environment.apiUrl}/admin/reservations/${id}`);
  }

  /**
   * Cancel a reservation
   */
  cancelReservation(id: number): Observable<DetailedReservationDto> {
    return this.http.post<DetailedReservationDto>(`${this.baseUrl}/${id}/cancel`, {});
  }

  /**
   * Get available slots for a specific vehicle
   */
  getAvailableSlots(vehicleId: number): Observable<SlotDto[]> {
    return this.http.get<SlotDto[]>(`${this.baseUrl}/vehicles/${vehicleId}/available-slots`);
  }

  /**
   * Get all reservations (Admin only)
   */
  getAllReservations(filter: ReservationFilter, pageable: Pageable): Observable<Page<ReservationSummaryDto>> {
    let params = new HttpParams()
      .set('page', pageable.page.toString())
      .set('size', pageable.size.toString());
    
    if (filter.userId) {
      params = params.set('userId', filter.userId.toString());
    }
    if (filter.vehicleId) {
      params = params.set('vehicleId', filter.vehicleId.toString());
    }
    if (filter.status) {
      params = params.set('status', filter.status);
    }
    if (filter.startDate) {
      params = params.set('startDate', filter.startDate.toISOString());
    }
    if (filter.endDate) {
      params = params.set('endDate', filter.endDate.toISOString());
    }

    return this.http.get<Page<ReservationSummaryDto>>(`${environment.apiUrl}/admin/reservations`, { params });
  }

  /**
   * Update reservation status (Admin only)
   */
  updateReservationStatus(id: number, request: AdminReservationUpdateRequest): Observable<DetailedReservationDto> {
    return this.http.patch<DetailedReservationDto>(`${environment.apiUrl}/admin/reservations/${id}`, request);
  }

  /**
   * Delete a reservation (Admin only)
   */
  deleteReservation(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/admin/reservations/${id}`);
  }

  /**
   * Get reservation statistics for the current user
   */
  getReservationStats(): Observable<{
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  }> {
    return this.http.get<any>(`${this.baseUrl}/stats`);
  }

  /**
   * Check if a vehicle is available for the given date range
   */
  checkVehicleAvailability(vehicleId: number, startDate: Date, endDate: Date): Observable<boolean> {
    const params = new HttpParams()
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString());
    
    return this.http.get<boolean>(`${environment.apiUrl}/vehicles/${vehicleId}/availability`, { params });
  }
}
