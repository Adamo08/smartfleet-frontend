import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Skeleton } from '../skeleton/skeleton';
import { SkeletonTable } from '../skeleton-table/skeleton-table';
import { SkeletonFilter } from '../skeleton-filter/skeleton-filter';
import { SkeletonCard } from '../skeleton-card/skeleton-card';

@Component({
  selector: 'app-skeleton-page',
  standalone: true,
  imports: [CommonModule, Skeleton, SkeletonTable, SkeletonFilter, SkeletonCard],
  template: `
    <div class="p-6 backdrop-blur-2xl bg-gradient-to-br from-slate-900/40 via-indigo-900/30 to-slate-900/40 border border-white/10 rounded-3xl">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <app-skeleton 
          width="200px" 
          height="32px"
        ></app-skeleton>
        <app-skeleton 
          width="140px" 
          height="40px" 
          borderRadius="12px"
        ></app-skeleton>
      </div>

      <!-- Filters -->
      @if (showFilters) {
        <app-skeleton-filter 
          [filters]="filterCount"
          [additionalFilters]="additionalFilterCount"
          [showAdditionalFilters]="showAdditionalFilters"
          [showActions]="showFilterActions">
        </app-skeleton-filter>
      }

      <!-- Content -->
      @if (pageType === 'table') {
        <app-skeleton-table 
          [headers]="tableHeaders"
          [rows]="tableRows">
        </app-skeleton-table>
      } @else if (pageType === 'cards') {
        <div class="space-y-4">
          @for (item of [1,2,3,4,5]; track item) {
            <app-skeleton-card></app-skeleton-card>
          }
        </div>
      } @else if (pageType === 'grid') {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (item of [1,2,3,4,5,6]; track item) {
            <app-skeleton-card></app-skeleton-card>
          }
        </div>
      } @else if (pageType === 'list') {
        <div class="space-y-3">
          @for (item of [1,2,3,4,5]; track item) {
            <div class="flex items-center justify-between p-4 bg-slate-800/30 border border-white/10 rounded-xl">
              <div class="flex items-center space-x-4">
                <app-skeleton 
                  width="48px" 
                  height="48px" 
                  borderRadius="50%"
                ></app-skeleton>
                <div>
                  <app-skeleton 
                    width="150px" 
                    height="16px" 
                    additionalClasses="mb-2"
                  ></app-skeleton>
                  <app-skeleton 
                    width="100px" 
                    height="14px"
                  ></app-skeleton>
                </div>
              </div>
              <div class="flex space-x-2">
                @for (action of [1,2,3]; track action) {
                  <app-skeleton 
                    width="20px" 
                    height="20px" 
                    borderRadius="4px"
                  ></app-skeleton>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Pagination -->
      @if (showPagination) {
        <div class="mt-6 flex justify-center">
          <div class="flex space-x-2">
            @for (page of [1,2,3,4,5]; track page) {
              <app-skeleton 
                width="40px" 
                height="40px" 
                borderRadius="8px"
              ></app-skeleton>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class SkeletonPage {
  @Input() pageType: 'table' | 'cards' | 'grid' | 'list' = 'table';
  @Input() showFilters: boolean = true;
  @Input() showPagination: boolean = true;
  @Input() filterCount: number = 4;
  @Input() additionalFilterCount: number = 4;
  @Input() showAdditionalFilters: boolean = true;
  @Input() showFilterActions: boolean = true;
  @Input() tableHeaders: string[] = ['ID', 'Name', 'Email', 'Status', 'Actions'];
  @Input() tableRows: number = 5;
}
