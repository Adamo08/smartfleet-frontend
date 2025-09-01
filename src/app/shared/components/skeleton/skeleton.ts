import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="animate-pulse bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%]"
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
    
    .animate-pulse {
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