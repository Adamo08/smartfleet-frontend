import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Skeleton } from '../skeleton/skeleton';
import { SkeletonChart } from '../skeleton-chart/skeleton-chart';

@Component({
  selector: 'app-skeleton-dashboard',
  standalone: true,
  imports: [CommonModule, Skeleton, SkeletonChart],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <app-skeleton
          width="300px"
          height="32px"
        ></app-skeleton>
        <app-skeleton
          width="120px"
          height="40px"
          borderRadius="12px"
        ></app-skeleton>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        @for (stat of Array(stats); track $index) {
          <div class="backdrop-blur-sm bg-white/5 border border-white/10 rounded-3xl p-6">
            <div class="flex items-center">
              <app-skeleton
                width="48px"
                height="48px"
                borderRadius="12px"
                additionalClasses="mr-4"
              ></app-skeleton>
              <div class="flex-1">
                <app-skeleton
                  width="80px"
                  height="14px"
                  additionalClasses="mb-2"
                ></app-skeleton>
                <app-skeleton
                  width="120px"
                  height="24px"
                ></app-skeleton>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        @for (chart of charts; track $index) {
          <app-skeleton-chart
            [chartType]="chart.type"
            [showControls]="chart.showControls"
            [showLegend]="chart.showLegend">
          </app-skeleton-chart>
        }
      </div>

      <!-- Recent Activity -->
      <div class="backdrop-blur-sm bg-white/5 border border-white/10 rounded-3xl p-6">
        <div class="flex items-center justify-between mb-6">
          <app-skeleton
            width="200px"
            height="24px"
          ></app-skeleton>
          <app-skeleton
            width="100px"
            height="32px"
            borderRadius="8px"
          ></app-skeleton>
        </div>

        <div class="space-y-4">
          @for (activity of Array(activities); track $index) {
            <div class="flex items-center space-x-4">
              <app-skeleton
                width="40px"
                height="40px"
                borderRadius="50%"
              ></app-skeleton>
              <div class="flex-1">
                <app-skeleton
                  width="200px"
                  height="16px"
                  additionalClasses="mb-1"
                ></app-skeleton>
                <app-skeleton
                  width="150px"
                  height="14px"
                ></app-skeleton>
              </div>
              <app-skeleton
                width="80px"
                height="16px"
              ></app-skeleton>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class SkeletonDashboard {
  @Input() stats: number = 4;
  @Input() charts: { type: 'line' | 'bar' | 'doughnut' | 'pie', showControls: boolean, showLegend: boolean }[] = [
    { type: 'line', showControls: true, showLegend: true },
    { type: 'bar', showControls: false, showLegend: true }
  ];
  @Input() activities: number = 5;
  protected readonly Array = Array;
}
