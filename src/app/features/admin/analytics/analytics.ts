import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { AnalyticsService, AnalyticsReport } from '../../../core/services/analytics.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './analytics.html',
  styleUrl: './analytics.css'
})
export class Analytics implements OnInit, OnDestroy {
  analyticsReport: AnalyticsReport | null = null;
  isLoading = true;
  filterForm: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(private analyticsService: AnalyticsService, private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      startDate: [''],
      endDate: ['']
    });
  }

  ngOnInit(): void {
    this.setupFilterListener();
    this.loadAnalytics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

    this.analyticsService.getPaymentAnalytics(startDate, endDate).subscribe({
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

  onFilterReset(): void {
    this.filterForm.reset();
    this.loadAnalytics();
  }
}
