import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { SkeletonCard } from '../../../shared/components/skeleton-card/skeleton-card';
import { SkeletonChart } from '../../../shared/components/skeleton-chart/skeleton-chart';
import { VehicleAnalytics } from '../../../shared/components/vehicle-analytics/vehicle-analytics';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { AnalyticsService, AnalyticsReport } from '../../../core/services/analytics.service';
import { DashboardService, DashboardAnalytics } from '../../../core/services/dashboard.service';
import { ActivityStats } from '../../../core/models/activity.interface';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, SkeletonCard, SkeletonChart, VehicleAnalytics],
  templateUrl: './analytics.html',
  styleUrl: './analytics.css'
})
export class Analytics implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('revenueChart') revenueChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('utilizationChart') utilizationChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('activityChart') activityChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('paymentMethodChart') paymentMethodChartRef!: ElementRef<HTMLCanvasElement>;

  analyticsReport: AnalyticsReport | null = null;
  dashboardAnalytics: DashboardAnalytics | null = null;
  activityStats: ActivityStats | null = null;
  paymentMethodStats: {[key: string]: number} | null = null;
  isLoading = true;
  filterForm: FormGroup;
  
  // Chart instances
  private revenueChart?: Chart;
  private utilizationChart?: Chart;
  private activityChart?: Chart;
  private paymentMethodChart?: Chart;
  
  private destroy$ = new Subject<void>();

  constructor(
    private analyticsService: AnalyticsService, 
    private dashboardService: DashboardService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      startDate: [''],
      endDate: ['']
    });
  }

  ngOnInit(): void {
    this.setupFilterListener();
    this.loadAnalytics();
  }

  ngAfterViewInit(): void {
    // Charts will be initialized when data is loaded
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // Cleanup charts
    if (this.revenueChart) this.revenueChart.destroy();
    if (this.utilizationChart) this.utilizationChart.destroy();
    if (this.activityChart) this.activityChart.destroy();
    if (this.paymentMethodChart) this.paymentMethodChart.destroy();
  }

  private setupFilterListener(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.loadAnalytics();
      });
  }

  loadAnalytics(): void {
    this.isLoading = true;
    const startDate = this.filterForm.value.startDate;
    const endDate = this.filterForm.value.endDate;

    // Load payment analytics
    this.analyticsService.getPaymentAnalytics(startDate, endDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (report) => {
          this.analyticsReport = report;
          this.loadAdditionalData();
        },
        error: (err) => {
          console.error('Error fetching analytics report:', err);
          this.isLoading = false;
        }
      });
  }

  private loadAdditionalData(): void {
    // Load dashboard analytics, activity stats, and payment method stats in parallel
    const dashboardAnalytics$ = this.dashboardService.getDashboardAnalytics(30);
    const activityStats$ = this.dashboardService.getActivityStats(30);
    const paymentMethodStats$ = this.analyticsService.getPaymentMethodStatistics();

    // Load dashboard analytics
    dashboardAnalytics$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (analytics) => {
        this.dashboardAnalytics = analytics;
        this.checkAndInitializeCharts();
      },
      error: (err) => {
        console.error('Error fetching dashboard analytics:', err);
      }
    });

    // Load activity stats
    activityStats$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (stats) => {
        this.activityStats = stats;
        this.checkAndInitializeCharts();
      },
      error: (err) => {
        console.error('Error fetching activity stats:', err);
      }
    });

    // Load payment method stats
    paymentMethodStats$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (stats) => {
        this.paymentMethodStats = stats;
        this.checkAndInitializeCharts();
      },
      error: (err) => {
        console.error('Error fetching payment method stats:', err);
      }
    });
  }

  private checkAndInitializeCharts(): void {
    // Initialize charts when all data is loaded
    if (this.analyticsReport && this.dashboardAnalytics && this.activityStats && this.paymentMethodStats) {
      this.isLoading = false;
      setTimeout(() => {
        this.initializeCharts();
      }, 100);
    }
  }

  onFilterReset(): void {
    this.filterForm.reset();
    this.loadAnalytics();
  }

  private initializeCharts(): void {
    this.createRevenueChart();
    this.createUtilizationChart();
    this.createActivityChart();
    this.createPaymentMethodChart();
  }

  private createRevenueChart(): void {
    if (!this.revenueChartRef?.nativeElement || !this.dashboardAnalytics?.revenueData) return;

    const ctx = this.revenueChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const revenueData = this.dashboardAnalytics.revenueData;

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: revenueData.map(d => new Date(d.date).toLocaleDateString()),
        datasets: [{
          label: 'Daily Revenue',
          data: revenueData.map(d => d.amount),
          borderColor: '#06B6D4',
          backgroundColor: 'rgba(6, 182, 212, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#06B6D4',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: {
              color: '#ffffff'
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#94A3B8',
              maxTicksLimit: 7
            },
            grid: {
              color: 'rgba(148, 163, 184, 0.1)'
            }
          },
          y: {
            ticks: {
              color: '#94A3B8',
              callback: function(value) {
                return '$' + Number(value).toLocaleString();
              }
            },
            grid: {
              color: 'rgba(148, 163, 184, 0.1)'
            }
          }
        }
      }
    };

    this.revenueChart = new Chart(ctx, config);
  }

  private createUtilizationChart(): void {
    if (!this.utilizationChartRef?.nativeElement || !this.dashboardAnalytics?.vehicleUtilization) return;

    const ctx = this.utilizationChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const utilizationData = this.dashboardAnalytics.vehicleUtilization;
    const vehicleTypes = utilizationData.map(d => d.vehicleType);
    const utilizationRates = utilizationData.map(d => d.utilizationRate);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: vehicleTypes,
        datasets: [{
          label: 'Utilization Rate (%)',
          data: utilizationRates,
          backgroundColor: [
            '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444',
            '#EC4899', '#14B8A6', '#F97316', '#84CC16', '#6366F1'
          ],
          borderColor: [
            '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444',
            '#EC4899', '#14B8A6', '#F97316', '#84CC16', '#6366F1'
          ],
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#94A3B8'
            },
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              color: '#94A3B8',
              callback: function(value) {
                return value + '%';
              }
            },
            grid: {
              color: 'rgba(148, 163, 184, 0.1)'
            }
          }
        }
      }
    };

    this.utilizationChart = new Chart(ctx, config);
  }

  private createActivityChart(): void {
    if (!this.activityChartRef?.nativeElement || !this.activityStats) return;

    const ctx = this.activityChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const activityTypes = Object.keys(this.activityStats);
    const activityCounts = Object.values(this.activityStats);

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: activityTypes,
        datasets: [{
          data: activityCounts,
          backgroundColor: [
            '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444',
            '#EC4899', '#14B8A6', '#F97316', '#84CC16', '#6366F1'
          ],
          borderColor: '#1e293b',
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#ffffff',
              usePointStyle: true,
              padding: 20
            }
          }
        }
      }
    };

    this.activityChart = new Chart(ctx, config);
  }

  private createPaymentMethodChart(): void {
    if (!this.paymentMethodChartRef?.nativeElement || !this.paymentMethodStats) return;

    const ctx = this.paymentMethodChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Use real payment method data from backend
    const paymentMethods = Object.keys(this.paymentMethodStats);
    const paymentCounts = Object.values(this.paymentMethodStats);

    const config: ChartConfiguration = {
      type: 'pie',
      data: {
        labels: paymentMethods,
        datasets: [{
          data: paymentCounts,
          backgroundColor: ['#06B6D4', '#10B981', '#F59E0B', '#8B5CF6'],
          borderColor: '#1e293b',
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#ffffff',
              usePointStyle: true,
              padding: 20
            }
          }
        }
      }
    };

    this.paymentMethodChart = new Chart(ctx, config);
  }
}
