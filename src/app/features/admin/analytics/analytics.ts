import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AnalyticsService, AnalyticsReport } from '../../../core/services/analytics.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './analytics.html',
  styleUrl: './analytics.css'
})
export class Analytics implements OnInit {
  analyticsReport: AnalyticsReport | null = null;
  isLoading = true;

  constructor(private analyticsService: AnalyticsService) { }

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.isLoading = true;
    this.analyticsService.getPaymentAnalytics().subscribe({
      next: (report) => {
        this.analyticsReport = report;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching analytics report:', err);
        this.isLoading = false;
      }
    });
  }
}
