import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Skeleton } from '../skeleton/skeleton';

@Component({
  selector: 'app-skeleton-card',
  standalone: true,
  imports: [CommonModule, Skeleton],
  template: `
    <div class="backdrop-blur-sm bg-white/5 border border-white/10 rounded-3xl p-6">
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
          borderRadius="16px"
        ></app-skeleton>
      </div>
    </div>
  `
})
export class SkeletonCard {}
