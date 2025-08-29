import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { Subject, takeUntil } from 'rxjs';
import { 
  DashboardService, 
  DashboardStats, 
  DashboardAnalytics,
  RevenueDataPoint,
  VehicleUtilizationData,
  MonthlyPerformanceData
} from '../../../core/services/dashboard.service';
import { RecentActivities, ActivityItem } from '../../../core/models/activity.interface';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, AfterViewInit, OnDestroy {
  
  @ViewChild('revenueChart') revenueChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusChart') statusChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('utilizationChart') utilizationChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('performanceChart') performanceChartRef!: ElementRef<HTMLCanvasElement>;

  dashboardStats: DashboardStats | null = null;
  dashboardAnalytics: DashboardAnalytics | null = null;
  recentActivities: RecentActivities | null = null;
  isLoading = false;
  
  // Chart instances
  private revenueChart?: Chart;
  private statusChart?: Chart;
  private utilizationChart?: Chart;
  private performanceChart?: Chart;

  // Subject for handling component destruction
  private destroy$ = new Subject<void>();

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    // Initialize charts after view is ready and data is available
    setTimeout(() => {
      if (this.dashboardStats && this.dashboardAnalytics) {
        this.initializeCharts();
      }
    }, 200);
  }

    private loadDashboardData(): void {
    this.isLoading = true;
    
    // Load dashboard statistics
    this.dashboardService.getDashboardStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.dashboardStats = stats;
          this.loadAnalyticsData();
          this.loadRecentActivities();
        },
        error: (error) => {
          console.error('Error loading dashboard stats:', error);
          this.isLoading = false;
        }
      });
  }

  private loadAnalyticsData(): void {
    // Load dashboard analytics for charts
    this.dashboardService.getDashboardAnalytics(30)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (analytics) => {
          this.dashboardAnalytics = analytics;
          this.isLoading = false;
          
          // Initialize charts after data is loaded and view is ready
          setTimeout(() => {
            if (this.revenueChartRef && this.statusChartRef && this.utilizationChartRef && this.performanceChartRef) {
              // If charts don't exist yet, initialize them
              if (!this.revenueChart || !this.statusChart || !this.utilizationChart || !this.performanceChart) {
                this.initializeCharts();
              } else {
                // If charts exist, just update them
                this.updateCharts();
              }
            }
          }, 200);
        },
        error: (error) => {
          console.error('Error loading dashboard analytics:', error);
          this.isLoading = false;
        }
      });
  }

  private loadRecentActivities(): void {
    this.dashboardService.getRecentActivities(4)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (activities) => {
          this.recentActivities = activities;
        },
        error: (error) => {
          console.error('Error loading recent activities:', error);
        }
      });
  }

  // Helper method to format activity timestamp
  getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const activityDate = new Date(timestamp);
    const diff = now.getTime() - activityDate.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
    
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }

  private initializeCharts(): void {
    this.createRevenueChart();
    this.createStatusChart();
    this.createUtilizationChart();
    this.createPerformanceChart();
  }

  private updateCharts(): void {
    if (this.revenueChart) this.updateRevenueChart();
    if (this.statusChart) this.updateStatusChart();
    if (this.utilizationChart) this.updateUtilizationChart();
    if (this.performanceChart) this.updatePerformanceChart();
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
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#06B6D4',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
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
        },
        elements: {
          point: {
            hoverBackgroundColor: '#06B6D4'
          }
        }
      }
    };

    this.revenueChart = new Chart(ctx, config);
  }

  private createStatusChart(): void {
    if (!this.statusChartRef?.nativeElement || !this.dashboardStats) return;

    const ctx = this.statusChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'Pending', 'Cancelled'],
        datasets: [{
          data: [
            this.dashboardStats.completedReservations,
            this.dashboardStats.pendingReservations,
            this.dashboardStats.cancelledReservations
          ],
          backgroundColor: [
            '#10B981',
            '#F59E0B',
            '#EF4444'
          ],
          borderColor: [
            '#10B981',
            '#F59E0B',
            '#EF4444'
          ],
          borderWidth: 2,
          hoverBackgroundColor: [
            '#34D399',
            '#FBBF24',
            '#F87171'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#94A3B8',
              padding: 20,
              font: {
                size: 12
              }
            }
          }
        }
      }
    };

    this.statusChart = new Chart(ctx, config);
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
            '#8B5CF6',
            '#06B6D4',
            '#10B981',
            '#F59E0B',
            '#EF4444'
          ],
          borderColor: [
            '#8B5CF6',
            '#06B6D4',
            '#10B981',
            '#F59E0B',
            '#EF4444'
          ],
          borderWidth: 1,
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

  private createPerformanceChart(): void {
    if (!this.performanceChartRef?.nativeElement || !this.dashboardAnalytics?.monthlyPerformance) return;

    const ctx = this.performanceChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const performanceData = this.dashboardAnalytics.monthlyPerformance;
    const months = performanceData.map(d => d.month);
    const reservations = performanceData.map(d => d.reservationCount);
    const revenue = performanceData.map(d => d.revenue);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Reservations',
            data: reservations,
            borderColor: '#8B5CF6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            yAxisID: 'y',
            tension: 0.4
          },
          {
            label: 'Revenue ($)',
            data: revenue,
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            yAxisID: 'y1',
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            labels: {
              color: '#94A3B8'
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#94A3B8'
            },
            grid: {
              color: 'rgba(148, 163, 184, 0.1)'
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            ticks: {
              color: '#94A3B8'
            },
            grid: {
              color: 'rgba(148, 163, 184, 0.1)'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            ticks: {
              color: '#94A3B8',
              callback: function(value) {
                return '$' + Number(value).toLocaleString();
              }
            },
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    };

    this.performanceChart = new Chart(ctx, config);
  }

  // Update methods for each chart
  private updateRevenueChart(): void {
    if (this.revenueChart && this.dashboardAnalytics?.revenueData) {
      const revenueData = this.dashboardAnalytics.revenueData;
      this.revenueChart.data.labels = revenueData.map(d => new Date(d.date).toLocaleDateString());
      this.revenueChart.data.datasets[0].data = revenueData.map(d => d.amount);
      this.revenueChart.update();
    }
  }

  private updateStatusChart(): void {
    if (this.statusChart && this.dashboardStats) {
      this.statusChart.data.datasets[0].data = [
        this.dashboardStats.completedReservations,
        this.dashboardStats.pendingReservations,
        this.dashboardStats.cancelledReservations
      ];
      this.statusChart.update();
    }
  }

  private updateUtilizationChart(): void {
    if (this.utilizationChart && this.dashboardAnalytics?.vehicleUtilization) {
      const utilizationData = this.dashboardAnalytics.vehicleUtilization;
      this.utilizationChart.data.labels = utilizationData.map(d => d.vehicleType);
      this.utilizationChart.data.datasets[0].data = utilizationData.map(d => d.utilizationRate);
      this.utilizationChart.update();
    }
  }

  private updatePerformanceChart(): void {
    if (this.performanceChart && this.dashboardAnalytics?.monthlyPerformance) {
      const performanceData = this.dashboardAnalytics.monthlyPerformance;
      this.performanceChart.data.labels = performanceData.map(d => d.month);
      this.performanceChart.data.datasets[0].data = performanceData.map(d => d.reservationCount);
      this.performanceChart.data.datasets[1].data = performanceData.map(d => d.revenue);
      this.performanceChart.update();
    }
  }

  // Event handlers
  onRevenueTimeframeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const days = parseInt(select.value);
    
    // Load new analytics data with the selected timeframe
    this.dashboardService.getDashboardAnalytics(days)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (analytics) => {
          this.dashboardAnalytics = analytics;
          this.updateRevenueChart();
        },
        error: (error) => {
          console.error('Error loading analytics data:', error);
        }
      });
  }

  ngOnDestroy(): void {
    // Complete the destroy subject to unsubscribe from all observables
    this.destroy$.next();
    this.destroy$.complete();
    
    // Clean up chart instances
    this.revenueChart?.destroy();
    this.statusChart?.destroy();
    this.utilizationChart?.destroy();
    this.performanceChart?.destroy();
  }
}