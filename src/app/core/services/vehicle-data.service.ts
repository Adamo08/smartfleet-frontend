import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api';
import { VehicleBrand } from '../models/vehicle-brand.interface';
import { VehicleCategory } from '../models/vehicle-category.interface';
import { VehicleModel } from '../models/vehicle-model.interface';

/**
 * Service for fetching active vehicle data for customer interfaces.
 * This service ensures inactive brands/categories/models don't appear in customer dropdowns.
 */
@Injectable({
  providedIn: 'root'
})
export class VehicleDataService {

  constructor(private apiService: ApiService) {}

  /**
   * Get only active brands for customer dropdowns.
   * Inactive brands will not appear in booking interfaces.
   */
  getActiveBrands(): Observable<VehicleBrand[]> {
    return this.apiService.get<VehicleBrand[]>('/vehicles/brands/active');
  }

  /**
   * Get only active categories for customer dropdowns.
   * Inactive categories will not appear in booking interfaces.
   */
  getActiveCategories(): Observable<VehicleCategory[]> {
    return this.apiService.get<VehicleCategory[]>('/vehicles/categories/active');
  }

  /**
   * Get only active models for customer dropdowns.
   * Inactive models will not appear in booking interfaces.
   */
  getActiveModels(): Observable<VehicleModel[]> {
    return this.apiService.get<VehicleModel[]>('/vehicles/models/active');
  }

  /**
   * Get active models for a specific brand.
   * Only returns models that are active AND belong to an active brand.
   */
  getActiveModelsByBrand(brandId: number): Observable<VehicleModel[]> {
    return this.apiService.get<VehicleModel[]>(`/vehicles/models/active/brand/${brandId}`);
  }

  /**
   * Check if a vehicle is available for booking.
   * This includes checks for inactive brands/categories/models.
   */
  checkVehicleAvailability(vehicleId: number, startDate: string, endDate: string): Observable<any> {
    return this.apiService.get<any>(`/vehicles/${vehicleId}/availability`, {
      startDate,
      endDate
    });
  }
}
