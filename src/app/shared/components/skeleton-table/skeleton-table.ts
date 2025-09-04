import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Skeleton } from '../skeleton/skeleton';

@Component({
  selector: 'app-skeleton-table',
  standalone: true,
  imports: [CommonModule, Skeleton],
  template: `
    <div class="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
      <table class="min-w-full text-sm bg-white">
        <thead>
          <tr class="text-left border-b border-gray-200 bg-gray-50">
            @for (header of headers; track header) {
              <th class="p-3">
                <app-skeleton 
                  width="80px" 
                  height="16px"
                ></app-skeleton>
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of [1,2,3,4,5]; track row) {
            <tr class="border-b border-gray-100">
              @for (cell of headers; track cell) {
                <td class="p-3">
                  @if (cell === 'Image') {
                    <app-skeleton 
                      width="48px" 
                      height="32px" 
                      borderRadius="8px"
                    ></app-skeleton>
                  } @else if (cell === 'Status') {
                    <app-skeleton 
                      width="80px" 
                      height="20px" 
                      borderRadius="12px"
                    ></app-skeleton>
                  } @else if (cell === 'Actions') {
                    <div class="flex space-x-2">
                      @for (action of [1,2,3]; track action) {
                        <app-skeleton 
                          width="20px" 
                          height="20px" 
                          borderRadius="4px"
                        ></app-skeleton>
                      }
                    </div>
                  } @else {
                    <app-skeleton 
                      width="100px" 
                      height="16px"
                    ></app-skeleton>
                  }
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class SkeletonTable {
  @Input() headers: string[] = ['ID', 'Name', 'Email', 'Status', 'Actions'];
  @Input() rows: number = 5;
}
