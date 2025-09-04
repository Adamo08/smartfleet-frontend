import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Skeleton } from '../skeleton/skeleton';

@Component({
  selector: 'app-skeleton-card',
  standalone: true,
  imports: [CommonModule, Skeleton],
  template: `
    <div class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <app-skeleton 
            width="40%" 
            height="16px" 
            additionalClasses="mb-3"
          ></app-skeleton>
          <app-skeleton 
            width="60%" 
            height="32px"
          ></app-skeleton>
        </div>
        <app-skeleton 
          width="48px" 
          height="48px" 
          borderRadius="12px"
        ></app-skeleton>
      </div>
    </div>
  `
})
export class SkeletonCard {}
