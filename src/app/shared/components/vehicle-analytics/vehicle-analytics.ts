import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, VehicleBreakdownData } from '../../../core/services/dashboard.service';
import { Subject, takeUntil } from 'rxjs';
import { Skeleton } from '../skeleton/skeleton';
import { SkeletonCard } from '../skeleton-card/skeleton-card';


@Component({
  selector: 'app-vehicle-analytics',
  standalone: true,
  imports: [CommonModule, Skeleton, SkeletonCard],
  templateUrl: './vehicle-analytics.html',
  styleUrls: ['./vehicle-analytics.css']
})
export class VehicleAnalytics implements OnInit, OnDestroy {
  vehicleData: VehicleBreakdownData | null = null;
  loading = true;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  // Pagination for analytics sections
  categoryAnalyticsPage = 0;
  brandAnalyticsPage = 0;
  modelAnalyticsPage = 0;
  analyticsItemsPerPage = 3;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.loadVehicleAnalytics();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadVehicleAnalytics() {
    this.loading = true;
    this.error = null;

    this.dashboardService.getVehicleBreakdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.vehicleData = data;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading vehicle analytics:', error);
          this.error = 'Failed to load vehicle analytics';
          this.loading = false;
        }
      });
  }


  getTopBrands() {
    return this.vehicleData?.brands
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5) || [];
  }

  getTopCategories() {
    return this.vehicleData?.categories
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5) || [];
  }

  getPeakHours() {
    return this.vehicleData?.utilization.hourlyBreakdown
      .sort((a, b) => b.reservations - a.reservations)
      .slice(0, 3) || [];
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat().format(value);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }


  getStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      'AVAILABLE': '#10B981',
      'RENTED': '#3B82F6',
      'IN_MAINTENANCE': '#F59E0B',
      'OUT_OF_SERVICE': '#EF4444'
    };
    return statusColors[status] || '#6B7280';
  }


  formatHour(hour: number): string {
    return `${hour.toString().padStart(2, '0')}:00`;
  }

  getUtilizationBarWidth(rate: number): string {
    return `${Math.min(rate, 100)}%`;
  }

  getRevenueBarWidth(revenue: number, maxRevenue: number): string {
    return maxRevenue > 0 ? `${(revenue / maxRevenue) * 100}%` : '0%';
  }

  getMaxCategoryRevenue(): number {
    return Math.max(...(this.vehicleData?.categories.map(c => c.totalRevenue) || [0]));
  }

  getMaxBrandRevenue(): number {
    return Math.max(...(this.vehicleData?.brands.map(b => b.totalRevenue) || [0]));
  }

  refresh() {
    this.loadVehicleAnalytics();
  }

  // Category pagination methods
  getCurrentCategoriesPage() {
    if (!this.vehicleData?.categories) return [];
    const start = this.categoryAnalyticsPage * this.analyticsItemsPerPage;
    return this.vehicleData.categories.slice(start, start + this.analyticsItemsPerPage);
  }

  getTotalCategoryPages(): number {
    if (!this.vehicleData?.categories) return 1;
    return Math.ceil(this.vehicleData.categories.length / this.analyticsItemsPerPage);
  }

  nextCategoryPage() {
    if (this.categoryAnalyticsPage < this.getTotalCategoryPages() - 1) {
      this.categoryAnalyticsPage++;
    }
  }

  previousCategoryPage() {
    if (this.categoryAnalyticsPage > 0) {
      this.categoryAnalyticsPage--;
    }
  }

  // Brand pagination methods
  getCurrentBrandsPage() {
    if (!this.vehicleData?.brands) return [];
    const start = this.brandAnalyticsPage * this.analyticsItemsPerPage;
    return this.vehicleData.brands.slice(start, start + this.analyticsItemsPerPage);
  }

  getTotalBrandPages(): number {
    if (!this.vehicleData?.brands) return 1;
    return Math.ceil(this.vehicleData.brands.length / this.analyticsItemsPerPage);
  }

  nextBrandPage() {
    if (this.brandAnalyticsPage < this.getTotalBrandPages() - 1) {
      this.brandAnalyticsPage++;
    }
  }

  previousBrandPage() {
    if (this.brandAnalyticsPage > 0) {
      this.brandAnalyticsPage--;
    }
  }

  // Model pagination methods
  getCurrentModelsPage() {
    if (!this.vehicleData?.topModels) return [];
    const start = this.modelAnalyticsPage * this.analyticsItemsPerPage;
    return this.vehicleData.topModels.slice(start, start + this.analyticsItemsPerPage);
  }

  getTotalModelPages(): number {
    if (!this.vehicleData?.topModels) return 1;
    return Math.ceil(this.vehicleData.topModels.length / this.analyticsItemsPerPage);
  }

  nextModelPage() {
    if (this.modelAnalyticsPage < this.getTotalModelPages() - 1) {
      this.modelAnalyticsPage++;
    }
  }

  previousModelPage() {
    if (this.modelAnalyticsPage > 0) {
      this.modelAnalyticsPage--;
    }
  }
}
