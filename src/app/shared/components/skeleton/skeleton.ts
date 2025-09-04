import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] skeleton-shimmer"
      [style.width]="width"
      [style.height]="height"
      [style.border-radius]="borderRadius"
      [ngClass]="additionalClasses"
    ></div>
  `,
  styles: [`
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    
    .skeleton-shimmer {
      animation: shimmer 1.5s ease-in-out infinite;
    }
  `]
})
export class Skeleton {
  @Input() width: string = '100%';
  @Input() height: string = '20px';
  @Input() borderRadius: string = '8px';
  @Input() additionalClasses: string = '';
}