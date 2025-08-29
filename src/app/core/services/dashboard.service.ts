import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, combineLatest, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ActivityItem, RecentActivities, ActivityStats } from '../models/activity.interface';

export interface DashboardStats {
  totalUsers: number;
  totalAdmins: number;
  activeVehicles: number;
  totalReservations: number;
  pendingReservations: number;
  completedReservations: number;
  cancelledReservations: number;
  totalRevenue: number;
}

export interface RevenueDataPoint {
  date: string;
  amount: number;
}

export interface VehicleUtilizationData {
  vehicleType: string;
  utilizationRate: number;
  totalReservations: number;
  availableDays: number;
}

export interface MonthlyPerformanceData {
  month: string;
  reservationCount: number;
  revenue: number;
}

export interface DashboardAnalytics {
  revenueData: RevenueDataPoint[];
  vehicleUtilization: VehicleUtilizationData[];
  monthlyPerformance: MonthlyPerformanceData[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly baseUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  /**
   * Get dashboard statistics (totals and counts)
   */
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.baseUrl}/stats`);
  }

  /**
   * Get dashboard analytics data for charts
   */
  getDashboardAnalytics(days: number = 30): Observable<DashboardAnalytics> {
    return this.http.get<DashboardAnalytics>(`${this.baseUrl}/analytics`, {
      params: { days: days.toString() }
    });
  }

  /**
   * Get recent activities for dashboard
   */
  getRecentActivities(limit: number = 10): Observable<RecentActivities> {
    return this.http.get<RecentActivities>(`${this.baseUrl}/activities`, {
      params: { limit: limit.toString() }
    });
  }

  /**
   * Get activity statistics for analytics
   */
  getActivityStats(days: number = 30): Observable<ActivityStats> {
    return this.http.get<ActivityStats>(`${this.baseUrl}/activity-stats`, {
      params: { days: days.toString() }
    });
  }
}