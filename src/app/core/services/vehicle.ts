import { Injectable } from '@angular/core';
import { ApiService } from './api';
import { Vehicle } from '../models/vehicle.interface';
import { Observable } from 'rxjs';
import { Page, Pageable } from '../models/pagination.interface';

@Injectable({
  providedIn: 'root'
})
export class VehicleService {
  constructor(private apiService: ApiService) {}

  getVehicles(pageable: Pageable): Observable<Page<Vehicle>> {
    const params: { [key: string]: any } = {
      page: pageable.page,
      size: pageable.size,
      sortBy: pageable.sortBy,
      sortDirection: pageable.sortDirection
    };
    // Add filter parameters if they exist in pageable (assuming they will be added later)
    // For now, keep it simple as per current backend API
    return this.apiService.get<Page<Vehicle>>('/vehicles', params);
  }

  getVehicleById(id: number): Observable<Vehicle> {
    return this.apiService.get<Vehicle>(`/vehicles/${id}`);
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
}
