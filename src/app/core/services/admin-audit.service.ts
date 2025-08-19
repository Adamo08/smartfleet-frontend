import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminAuditLog {
  id: number;
  adminId: number;
  adminEmail: string;
  action: string;
  resource: string;
  resourceId?: number;
  details?: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface CreateAuditLogRequest {
  action: string;
  resource: string;
  resourceId?: number;
  details?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminAuditService {
  private readonly baseUrl = `${environment.apiUrl}/admin/audit`;

  constructor(private http: HttpClient) {}

  /**
   * Log an admin action for audit purposes
   */
  logAction(request: CreateAuditLogRequest): Observable<AdminAuditLog> {
    return this.http.post<AdminAuditLog>(`${this.baseUrl}/logs`, request);
  }

  /**
   * Get audit logs with pagination and filtering
   */
  getAuditLogs(
    page: number = 0,
    size: number = 20,
    adminId?: number,
    action?: string,
    resource?: string,
    startDate?: Date,
    endDate?: Date
  ): Observable<{
    content: AdminAuditLog[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  }> {
    let params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('size', size.toString());
    
    if (adminId) params.set('adminId', adminId.toString());
    if (action) params.set('action', action);
    if (resource) params.set('resource', resource);
    if (startDate) params.set('startDate', startDate.toISOString());
    if (endDate) params.set('endDate', endDate.toISOString());

    return this.http.get<any>(`${this.baseUrl}/logs?${params.toString()}`);
  }

  /**
   * Get audit log by ID
   */
  getAuditLogById(id: number): Observable<AdminAuditLog> {
    return this.http.get<AdminAuditLog>(`${this.baseUrl}/logs/${id}`);
  }

  /**
   * Export audit logs to CSV
   */
  exportAuditLogs(
    adminId?: number,
    action?: string,
    resource?: string,
    startDate?: Date,
    endDate?: Date
  ): Observable<Blob> {
    let params = new URLSearchParams();
    
    if (adminId) params.set('adminId', adminId.toString());
    if (action) params.set('action', action);
    if (resource) params.set('resource', resource);
    if (startDate) params.set('startDate', startDate.toISOString());
    if (endDate) params.set('endDate', endDate.toISOString());

    return this.http.get(`${this.baseUrl}/logs/export?${params.toString()}`, {
      responseType: 'blob'
    });
  }

  /**
   * Get audit statistics
   */
  getAuditStats(): Observable<{
    totalActions: number;
    actionsByType: { [key: string]: number };
    actionsByAdmin: { [key: string]: number };
    recentActivity: AdminAuditLog[];
  }> {
    return this.http.get<any>(`${this.baseUrl}/stats`);
  }
}
