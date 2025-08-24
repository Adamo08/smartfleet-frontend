import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api';

export interface EnumOption {
  value: string;
  label: string;
}

@Injectable({
  providedIn: 'root'
})
export class EnumService {

  constructor(private apiService: ApiService) {}

  getFuelTypes(): Observable<EnumOption[]> {
    return this.apiService.get<EnumOption[]>('/api/enums/fuel-types');
  }

  getVehicleStatuses(): Observable<EnumOption[]> {
    return this.apiService.get<EnumOption[]>('/api/enums/vehicle-statuses');
  }

  getReservationStatuses(): Observable<EnumOption[]> {
    return this.apiService.get<EnumOption[]>('/api/enums/reservation-statuses');
  }

  getUserRoles(): Observable<EnumOption[]> {
    return this.apiService.get<EnumOption[]>('/api/enums/user-roles');
  }
}
