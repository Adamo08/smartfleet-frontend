import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
import { Vehicle, VehicleSummaryDto } from '../models/vehicle.interface';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private readonly baseUrl = `${environment.apiUrl}/reservations`;

  constructor(private http: HttpClient) {}

  /**
   * Transforms a vehicle from backend format to frontend format
   */
  private transformVehicle(vehicle: any): Vehicle {
    return {
      ...vehicle,
      brand: vehicle.brandName,
      model: vehicle.modelName
    };
  }

  /**
   * Transforms a vehicle summary from backend format to frontend format
   */
  private transformVehicleSummary(vehicle: any): VehicleSummaryDto {
    return {
      ...vehicle,
      brand: vehicle.brandName,
      model: vehicle.modelName
    };
  }

  /**
   * Transforms a reservation summary to include vehicle transformations
   */
  private transformReservationSummary(reservation: any): ReservationSummaryDto {
    return {
      ...reservation,
      vehicle: this.transformVehicleSummary(reservation.vehicle)
    };
  }

  /**
   * Transforms a detailed reservation to include vehicle transformations  
   */
  private transformDetailedReservation(reservation: any): DetailedReservationDto {
    return {
      ...reservation,
      vehicle: this.transformVehicle(reservation.vehicle)
    };
  }

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

    return this.http.get<Page<ReservationSummaryDto>>(this.baseUrl, { params }).pipe(
      map(page => ({
        ...page,
        content: page.content.map(reservation => this.transformReservationSummary(reservation))
      }))
    );
  }

  /**
   * Get filtered reservations for the current user with pagination
   */
  getUserReservationsWithFilter(filter: ReservationFilter, pageable: Pageable): Observable<Page<ReservationSummaryDto>> {
    let params = new HttpParams()
      .set('page', pageable.page.toString())
      .set('size', pageable.size.toString())
      .set('sortBy', pageable.sortBy || 'createdAt')
      .set('sortDirection', pageable.sortDirection || 'DESC');

    if (filter.status) {
      params = params.set('status', filter.status);
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

    return this.http.get<Page<ReservationSummaryDto>>(`${this.baseUrl}/filtered`, { params }).pipe(
      map(page => ({
        ...page,
        content: page.content.map(reservation => this.transformReservationSummary(reservation))
      }))
    );
  }

  /**
   * Get a single reservation by ID for the current user
   */
  getReservationById(id: number): Observable<DetailedReservationDto> {
    return this.http.get<DetailedReservationDto>(`${this.baseUrl}/${id}`).pipe(
      map(reservation => this.transformDetailedReservation(reservation))
    );
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
  getAvailableSlots(vehicleId: number, startDate: Date, endDate: Date, bookingType: string = 'DAILY'): Observable<SlotDto[]> {
    const params = new HttpParams()
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString())
      .set('bookingType', bookingType);
    
    return this.http.get<SlotDto[]>(`${this.baseUrl}/vehicles/${vehicleId}/available-slots`, { params });
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
    if (filter.searchTerm && filter.searchTerm.trim() !== '') {
      params = params.set('searchTerm', filter.searchTerm.trim());
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
   * Update reservation (Admin only) - alias method for consistency
   */
  updateReservationAdmin(id: number, request: AdminReservationUpdateRequest): Observable<DetailedReservationDto> {
    return this.updateReservationStatus(id, request);
  }


  /**
   * Delete reservation (Admin only) - alias method for consistency
   */
  deleteReservationAdmin(id: number): Observable<void> {
    return this.deleteReservation(id);
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
    
    return this.http.get<{ isAvailable: boolean }>(`${environment.apiUrl}/vehicles/${vehicleId}/availability`, { params })
      .pipe(map(res => !!res?.isAvailable));
  }

  /**
   * Get blocked dates for a vehicle
   */
  getBlockedDatesForVehicle(vehicleId: number, startDate?: Date, endDate?: Date): Observable<string[]> {
    let params = new HttpParams();
    
    if (startDate) {
      params = params.set('startDate', startDate.toISOString());
    }
    if (endDate) {
      params = params.set('endDate', endDate.toISOString());
    }

    return this.http.get<string[]>(`${this.baseUrl}/vehicles/${vehicleId}/blocked-dates`, { params });
  }
}
