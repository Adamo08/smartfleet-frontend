import { Injectable } from '@angular/core';
import { ApiService } from './api';
import { Vehicle } from '../models/vehicle.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VehicleService {
  constructor(private apiService: ApiService) {}

  getVehicles(params?: any): Observable<Vehicle[]> {
    return this.apiService.get<Vehicle[]>('/vehicles', params);
  }

  getVehicleById(id: number): Observable<Vehicle> {
    return this.apiService.get<Vehicle>(`/vehicles/${id}`);
  }

  searchVehicles(params: any): Observable<Vehicle[]> {
    return this.apiService.get<Vehicle[]>('/vehicles/search', params);
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
