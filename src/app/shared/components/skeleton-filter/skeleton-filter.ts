import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Skeleton } from '../skeleton/skeleton';

@Component({
  selector: 'app-skeleton-filter',
  standalone: true,
  imports: [CommonModule, Skeleton],
  template: `
    <div class="mb-6 p-4 bg-gray-100 rounded-xl border border-gray-200">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        @for (filter of Array(filters); track $index) {
          <app-skeleton
            width="200px"
            height="40px"
            borderRadius="12px"
          ></app-skeleton>
        }

        @if (showAdditionalFilters) {
          @for (filter of Array(additionalFilters); track $index) {
            <app-skeleton
              width="150px"
              height="40px"
              borderRadius="12px"
            ></app-skeleton>
          }
        }

      @if (showActions) {
        <div class="flex justify-between items-center mt-4">
          <app-skeleton
            width="120px"
            height="40px"
            borderRadius="8px"
          ></app-skeleton>
          <app-skeleton
            width="120px"
            height="40px"
            borderRadius="8px"
          ></app-skeleton>
        </div>
      }
    </div>
    </div>
  `
})
export class SkeletonFilter {
  @Input() filters: number = 4;
  @Input() additionalFilters: number = 4;
  @Input() showAdditionalFilters: boolean = true;
  @Input() showActions: boolean = true;
  protected readonly Array = Array;
}
