import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AnalyticsReport {
  totalPayments: number;
  successfulPayments: number;
  totalRevenue: number;
  totalRefunds: number;
  successRate: number;
  refundRate: number;
  averagePaymentAmount: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly baseUrl = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) { }

  getPaymentAnalytics(startDate?: string, endDate?: string): Observable<AnalyticsReport> {
    let params = new HttpParams();
    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }
    return this.http.get<AnalyticsReport>(`${this.baseUrl}/analytics`, { params });
  }
}
