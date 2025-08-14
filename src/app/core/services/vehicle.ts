import { Injectable } from '@angular/core';
import { ApiService } from './api';
import { Vehicle } from '../models/vehicle.interface';
import { Observable, map } from 'rxjs';

interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class VehicleService {
  constructor(private apiService: ApiService) {}

  getVehicles(params?: any): Observable<Vehicle[]> {
    return this.apiService.get<PaginatedResponse<Vehicle>>('/vehicles', params).pipe(
      map(response => response.content)
    );
  }

  getVehicleById(id: number): Observable<Vehicle> {
    return this.apiService.get<Vehicle>(`/vehicles/${id}`);
  }

  searchVehicles(params: any): Observable<Vehicle[]> {
    return this.apiService.get<PaginatedResponse<Vehicle>>('/vehicles/search', params).pipe(
      map(response => response.content)
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
}
