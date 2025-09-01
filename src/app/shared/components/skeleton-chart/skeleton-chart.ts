import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Skeleton } from '../skeleton/skeleton';

@Component({
  selector: 'app-skeleton-chart',
  standalone: true,
  imports: [CommonModule, Skeleton],
  template: `
    <div class="backdrop-blur-sm bg-white/5 border border-white/10 rounded-3xl p-8">
      <!-- Chart Title -->
      <div class="flex items-center justify-between mb-6">
        <app-skeleton 
          width="180px" 
          height="24px"
        ></app-skeleton>
        @if (showControls) {
          <app-skeleton 
            width="120px" 
            height="32px" 
            borderRadius="8px"
          ></app-skeleton>
        }
      </div>
      
      <!-- Chart Area -->
      <div class="relative h-64 flex items-end space-x-2">
        @if (chartType === 'line') {
          <!-- Line Chart Skeleton -->
          <div class="w-full h-full relative">
            <!-- Grid Lines -->
            <div class="absolute inset-0 grid grid-cols-7 grid-rows-4 gap-4">
              @for (item of [1,2,3,4,5,6,7]; track item) {
                <div class="border-r border-white/10 last:border-r-0"></div>
              }
            </div>
            <!-- Chart Line -->
            <svg class="absolute inset-0 w-full h-full">
              <path 
                d="M 10 180 Q 50 120 90 140 T 170 100 T 250 120 T 330 80" 
                stroke="rgb(6 182 212 / 0.5)" 
                stroke-width="3" 
                fill="none"
                class="animate-pulse"
              />
            </svg>
          </div>
        } @else if (chartType === 'bar') {
          <!-- Bar Chart Skeleton -->
          @for (bar of bars; track $index) {
            <app-skeleton 
              [width]="'40px'" 
              [height]="bar + 'px'"
              borderRadius="4px"
              additionalClasses="flex-shrink-0"
            ></app-skeleton>
          }
        } @else if (chartType === 'doughnut' || chartType === 'pie') {
          <!-- Doughnut/Pie Chart Skeleton -->
          <div class="w-full h-full flex items-center justify-center">
            <app-skeleton 
              width="200px" 
              height="200px" 
              borderRadius="50%"
            ></app-skeleton>
          </div>
        } @else {
          <!-- Default Chart Skeleton -->
          <app-skeleton 
            width="100%" 
            height="100%"
          ></app-skeleton>
        }
      </div>
      
      @if (showLegend) {
        <!-- Legend -->
        <div class="flex justify-center space-x-4 mt-4">
          @for (item of [1,2,3]; track item) {
            <div class="flex items-center space-x-2">
              <app-skeleton 
                width="12px" 
                height="12px" 
                borderRadius="50%"
              ></app-skeleton>
              <app-skeleton 
                width="60px" 
                height="14px"
              ></app-skeleton>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class SkeletonChart {
  @Input() chartType: 'line' | 'bar' | 'doughnut' | 'pie' | 'default' = 'default';
  @Input() showControls: boolean = false;
  @Input() showLegend: boolean = false;

  // For bar chart skeleton
  bars = [120, 180, 100, 160, 140, 200, 80];
}
