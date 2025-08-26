import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  Slot, 
  SlotDto, 
  CreateSlotRequest, 
  SlotFilter 
} from '../models/slot.interface';
import { Page } from '../models/pagination.interface';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SlotService {
  private readonly baseUrl = `${environment.apiUrl}/slots`;

  constructor(private http: HttpClient) {}

  /**
   * Create a new slot (Admin only)
   */
  createSlot(slotDto: CreateSlotRequest): Observable<SlotDto> {
    return this.http.post<SlotDto>(this.baseUrl, slotDto);
  }

  /**
   * Get a slot by ID (Admin only)
   */
  getSlotById(id: number): Observable<SlotDto> {
    return this.http.get<SlotDto>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get available slots for a specific vehicle (Public endpoint)
   */
  getAvailableSlotsByVehicle(vehicleId: number): Observable<SlotDto[]> {
    return this.http.get<SlotDto[]>(`${this.baseUrl}/vehicle/${vehicleId}/available`);
  }

  /**
   * Book a slot (Admin only)
   */
  bookSlot(id: number): Observable<SlotDto> {
    return this.http.put<SlotDto>(`${this.baseUrl}/${id}/book`, {});
  }

  /**
   * Block a slot (Admin only)
   */
  blockSlot(id: number): Observable<SlotDto> {
    return this.http.put<SlotDto>(`${this.baseUrl}/${id}/block`, {});
  }

  /**
   * Delete a slot (Admin only)
   */
  deleteSlot(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get all slots with pagination and filtering (Admin only)
   */
  getAllSlots(
    page: number = 0, 
    size: number = 10, 
    isAvailable?: boolean, 
    sortBy: string = 'createdAt', 
    sortDirection: string = 'DESC',
    vehicleId?: number, // New filter parameter
    startDate?: Date, // New filter parameter
    endDate?: Date // New filter parameter
  ): Observable<Page<SlotDto>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);

    if (isAvailable !== undefined) {
      params = params.set('isAvailable', isAvailable.toString());
    }

    if (vehicleId !== undefined && vehicleId !== null) {
      params = params.set('vehicleId', vehicleId.toString());
    }

    if (startDate && endDate) {
      params = params.set('startDate', startDate.toISOString());
      params = params.set('endDate', endDate.toISOString());
    }
    
    return this.http.get<Page<SlotDto>>(this.baseUrl, { params });
  }

  /**
   * Get all slots for a vehicle (available and unavailable) within an optional date range
   */
  getAllSlotsInRange(vehicleId: number, startDate?: Date, endDate?: Date): Observable<SlotDto[]> {
    let params = new HttpParams();
    if (startDate && endDate) {
      params = params.set('start', startDate.toISOString()).set('end', endDate.toISOString());
    }
    return this.http.get<SlotDto[]>(`${this.baseUrl}/vehicle/${vehicleId}`, { params });
  }

  /**
   * Get available slots for a vehicle within a date range (fallback/simple)
   */
  getAvailableSlotsInRange(vehicleId: number, startDate: Date, endDate: Date): Observable<SlotDto[]> {
    // Backend does not filter by range on available endpoint; client-side filter after fetch
    return this.getAvailableSlotsByVehicle(vehicleId).pipe(
      map(slots => slots.filter(s => new Date(s.startTime) >= startDate && new Date(s.endTime) <= endDate))
    );
  }

  /**
   * Check if a slot is available for booking
   */
  isSlotAvailable(slotId: number): Observable<boolean> {
    return this.http.get<SlotDto>(`${this.baseUrl}/${slotId}`).pipe(
      map(slot => slot.available)
    );
  }
}
