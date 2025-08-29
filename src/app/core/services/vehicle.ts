import { Injectable } from '@angular/core';
import { ApiService } from './api';
import { Vehicle, VehicleSummaryDto } from '../models/vehicle.interface';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { Page, Pageable } from '../models/pagination.interface';
import { VehicleFilter } from '../models/vehicle-filter.interface';
import { VehicleBrand } from '../models/vehicle-brand.interface';
import { VehicleModel } from '../models/vehicle-model.interface';
import { VehicleCategory } from '../models/vehicle-category.interface';

@Injectable({
  providedIn: 'root'
})
export class VehicleService {
  constructor(private apiService: ApiService) {}

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

  getVehicles(
    pageable: Pageable,
    filters: VehicleFilter
  ): Observable<Page<Vehicle>> {
    let params = new HttpParams()
      .set('page', pageable.page.toString())
      .set('size', pageable.size.toString());

    if (pageable.sortBy) {
      params = params.set('sortBy', pageable.sortBy);
    }
    if (pageable.sortDirection) {
      params = params.set('sortDirection', pageable.sortDirection);
    }
    
    // Add filter parameters if they exist and are not null/empty
    if (filters.search) params = params.set('search', filters.search);
    if (filters.brandId !== undefined && filters.brandId !== null) params = params.set('brandId', filters.brandId.toString());
    if (filters.modelId !== undefined && filters.modelId !== null) params = params.set('modelId', filters.modelId.toString());
    if (filters.categoryId !== undefined && filters.categoryId !== null) params = params.set('categoryId', filters.categoryId.toString());
    if (filters.fuelType) params = params.set('fuelType', filters.fuelType);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.minPrice !== undefined && filters.minPrice !== null) params = params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice !== undefined && filters.maxPrice !== null) params = params.set('maxPrice', filters.maxPrice.toString());
    if (filters.minYear !== undefined && filters.minYear !== null) params = params.set('minYear', filters.minYear.toString());
    if (filters.maxYear !== undefined && filters.maxYear !== null) params = params.set('maxYear', filters.maxYear.toString());
    if (filters.minMileage !== undefined && filters.minMileage !== null) params = params.set('minMileage', filters.minMileage.toString());
    if (filters.maxMileage !== undefined && filters.maxMileage !== null) params = params.set('maxMileage', filters.maxMileage.toString());
    
    return this.apiService.get<Page<Vehicle>>('/vehicles', params).pipe(
      map(page => ({
        ...page,
        content: page.content.map(vehicle => this.transformVehicle(vehicle))
      }))
    );
  }

  getVehicleById(id: number): Observable<Vehicle> {
    return this.apiService.get<Vehicle>(`/vehicles/${id}`).pipe(
      map(vehicle => this.transformVehicle(vehicle))
    );
  }

  createVehicle(vehicle: Partial<Vehicle>): Observable<Vehicle> {
    return this.apiService.post<Vehicle>('/vehicles', vehicle);
  }

  updateVehicle(id: number, vehicle: Partial<Vehicle>): Observable<Vehicle> {
    return this.apiService.put<Vehicle>(`/vehicles/${id}`, vehicle);
  }

  deleteVehicle(id: number): Observable<void> {
    return this.apiService.delete<void>(`/vehicles/${id}`);
  }

  getAllVehicleCategories(): Observable<Page<VehicleCategory>> {
    // Assuming an endpoint like /admin/vehicle-categories for all categories
    return this.apiService.get<Page<VehicleCategory>>('/admin/vehicle-categories', { page: 0, size: 9999, sortBy: 'name', sortDirection: 'ASC' });
  }

  getAllVehicleBrands(): Observable<Page<VehicleBrand>> {
    // Assuming an endpoint like /admin/vehicle-brands for all brands
    return this.apiService.get<Page<VehicleBrand>>('/admin/vehicle-brands', { page: 0, size: 9999, sortBy: 'name', sortDirection: 'ASC' });
  }

  getAllVehicleModels(): Observable<Page<VehicleModel>> {
    // Assuming an endpoint like /admin/vehicle-models for all models
    return this.apiService.get<Page<VehicleModel>>('/admin/vehicle-models', { page: 0, size: 9999, sortBy: 'name', sortDirection: 'ASC' });
  }

  // Admin vehicle management methods with proper transformation
  
  /**
   * Get all vehicles for admin with pagination and filters (Admin)
   */
  getAdminVehicles(pageable: Pageable, filters: VehicleFilter = {}): Observable<Page<Vehicle>> {
    let params = new HttpParams()
      .set('page', pageable.page.toString())
      .set('size', pageable.size.toString());

    if (pageable.sortBy) {
      params = params.set('sortBy', pageable.sortBy);
    }
    if (pageable.sortDirection) {
      params = params.set('sortDirection', pageable.sortDirection);
    }
    
    // Add filter parameters if they exist and are not null/empty
    if (filters.search) params = params.set('search', filters.search);
    if (filters.brandId !== undefined && filters.brandId !== null) params = params.set('brandId', filters.brandId.toString());
    if (filters.modelId !== undefined && filters.modelId !== null) params = params.set('modelId', filters.modelId.toString());
    if (filters.categoryId !== undefined && filters.categoryId !== null) params = params.set('categoryId', filters.categoryId.toString());
    if (filters.fuelType) params = params.set('fuelType', filters.fuelType);
    if (filters.status) params = params.set('status', filters.status);
    
    return this.apiService.get<Page<Vehicle>>('/admin/vehicles', params).pipe(
      map(page => ({
        ...page,
        content: page.content.map(vehicle => this.transformVehicle(vehicle))
      }))
    );
  }

  /**
   * Get vehicle by ID for admin (Admin)
   */
  getAdminVehicleById(id: number): Observable<Vehicle> {
    return this.apiService.get<Vehicle>(`/admin/vehicles/${id}`).pipe(
      map(vehicle => this.transformVehicle(vehicle))
    );
  }

  /**
   * Create vehicle (Admin)
   */
  createAdminVehicle(vehicle: any): Observable<Vehicle> {
    return this.apiService.post<Vehicle>('/admin/vehicles', vehicle).pipe(
      map(vehicle => this.transformVehicle(vehicle))
    );
  }

  /**
   * Update vehicle (Admin)
   */
  updateAdminVehicle(id: number, vehicle: any): Observable<Vehicle> {
    return this.apiService.put<Vehicle>(`/admin/vehicles/${id}`, vehicle).pipe(
      map(vehicle => this.transformVehicle(vehicle))
    );
  }

  /**
   * Delete vehicle (Admin)
   */
  deleteAdminVehicle(id: number): Observable<void> {
    return this.apiService.delete<void>(`/admin/vehicles/${id}`);
  }
}
