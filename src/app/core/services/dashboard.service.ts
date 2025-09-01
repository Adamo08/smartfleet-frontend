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

export interface VehicleBreakdownData {
  overview: FleetOverview;
  categories: CategoryAnalytics[];
  brands: BrandAnalytics[];
  statuses: StatusAnalytics[];
  topModels: ModelAnalytics[];
  utilization: UtilizationMetrics;
  revenue: RevenueMetrics;
}

export interface FleetOverview {
  totalVehicles: number;
  activeVehicles: number;
  availableVehicles: number;
  inUseVehicles: number;
  maintenanceVehicles: number;
  utilizationRate: number;
  availabilityRate: number;
  totalBrands: number;
  totalCategories: number;
  totalModels: number;
}

export interface CategoryAnalytics {
  name: string;
  totalVehicles: number;
  availableVehicles: number;
  rentedVehicles: number;
  averagePrice: number;
  totalRevenue: number;
  utilizationRate: number;
  iconUrl?: string;
}

export interface BrandAnalytics {
  name: string;
  totalVehicles: number;
  availableVehicles: number;
  rentedVehicles: number;
  averagePrice: number;
  totalRevenue: number;
  averageRating: number;
  modelCount: number;
  marketShare: number;
}

export interface StatusAnalytics {
  status: string;
  count: number;
  percentage: number;
  color: string;
  description: string;
}

export interface ModelAnalytics {
  modelName: string;
  brandName: string;
  categoryName: string;
  totalVehicles: number;
  reservationCount: number;
  totalRevenue: number;
  averageRating: number;
  averagePrice: number;
}

export interface UtilizationMetrics {
  overallUtilization: number;
  mostUtilizedCategory: string;
  leastUtilizedCategory: string;
  mostUtilizedBrand: string;
  peakUsageHour: string;
  hourlyBreakdown: HourlyUtilization[];
}

export interface HourlyUtilization {
  hour: number;
  reservations: number;
  utilizationRate: number;
}

export interface RevenueMetrics {
  totalRevenue: number;
  averageRevenuePerVehicle: number;
  topRevenueCategory: string;
  topRevenueBrand: string;
  monthlyGrowth: number;
  categoryRevenue: CategoryRevenue[];
}

export interface CategoryRevenue {
  categoryName: string;
  revenue: number;
  percentage: number;
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

  /**
   * Get vehicle breakdown data for dashboard analytics
   */
  getVehicleBreakdown(): Observable<VehicleBreakdownData> {
    return this.http.get<VehicleBreakdownData>(`${this.baseUrl}/vehicle-breakdown`);
  }
}