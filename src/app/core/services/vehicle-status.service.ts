import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface VehicleStatusInfo {
  totalVehicles: number;
  affectedVehicles: number;
  hasActiveReservations: boolean;
  futureReservations: number;
}

export interface InactiveStatusResult {
  success: boolean;
  message: string;
  statusInfo?: VehicleStatusInfo;
  warnings?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class VehicleStatusService {
  private readonly baseUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  /**
   * Get status information for vehicles that would be affected by setting a brand inactive
   */
  getBrandStatusInfo(brandId: number): Observable<VehicleStatusInfo> {
    return this.http.get<VehicleStatusInfo>(`${this.baseUrl}/vehicle-brands/${brandId}/status-info`);
  }

  /**
   * Get status information for vehicles that would be affected by setting a category inactive
   */
  getCategoryStatusInfo(categoryId: number): Observable<VehicleStatusInfo> {
    return this.http.get<VehicleStatusInfo>(`${this.baseUrl}/vehicle-categories/${categoryId}/status-info`);
  }

  /**
   * Get status information for vehicles that would be affected by setting a model inactive
   */
  getModelStatusInfo(modelId: number): Observable<VehicleStatusInfo> {
    return this.http.get<VehicleStatusInfo>(`${this.baseUrl}/vehicle-models/${modelId}/status-info`);
  }

  /**
   * Set brand inactive and handle cascading effects
   */
  setBrandInactive(brandId: number, force: boolean = false): Observable<InactiveStatusResult> {
    return this.http.post<InactiveStatusResult>(`${this.baseUrl}/vehicle-brands/${brandId}/set-inactive`, { force });
  }

  /**
   * Set category inactive and handle cascading effects
   */
  setCategoryInactive(categoryId: number, force: boolean = false): Observable<InactiveStatusResult> {
    return this.http.post<InactiveStatusResult>(`${this.baseUrl}/vehicle-categories/${categoryId}/set-inactive`, { force });
  }

  /**
   * Set model inactive and handle cascading effects
   */
  setModelInactive(modelId: number, force: boolean = false): Observable<InactiveStatusResult> {
    return this.http.post<InactiveStatusResult>(`${this.baseUrl}/vehicle-models/${modelId}/set-inactive`, { force });
  }

  /**
   * Get warning messages for setting an entity inactive
   */
  getInactiveWarnings(entityType: 'brand' | 'category' | 'model', statusInfo: VehicleStatusInfo): string[] {
    const warnings: string[] = [];

    if (statusInfo.affectedVehicles > 0) {
      warnings.push(
        `${statusInfo.affectedVehicles} vehicle${statusInfo.affectedVehicles > 1 ? 's' : ''} will be hidden from customer searches`
      );
    }

    if (statusInfo.hasActiveReservations) {
      warnings.push('Some vehicles have active reservations that will continue as normal');
    }

    if (statusInfo.futureReservations > 0) {
      warnings.push(
        `${statusInfo.futureReservations} future reservation${statusInfo.futureReservations > 1 ? 's' : ''} will be automatically cancelled`
      );
    }

    if (statusInfo.affectedVehicles === 0) {
      warnings.push('No vehicles will be affected by this change');
    }

    return warnings;
  }

  /**
   * Format status impact message for display
   */
  formatStatusImpactMessage(entityType: 'brand' | 'category' | 'model', entityName: string, statusInfo: VehicleStatusInfo): string {
    const entityCapitalized = entityType.charAt(0).toUpperCase() + entityType.slice(1);
    
    if (statusInfo.affectedVehicles === 0) {
      return `Setting this ${entityType} inactive will not affect any vehicles.`;
    }

    let message = `Setting "${entityName}" ${entityType} inactive will affect ${statusInfo.affectedVehicles} vehicle${statusInfo.affectedVehicles > 1 ? 's' : ''}.`;
    
    if (statusInfo.futureReservations > 0) {
      message += ` ${statusInfo.futureReservations} future reservation${statusInfo.futureReservations > 1 ? 's' : ''} will be cancelled.`;
    }

    return message;
  }
}
