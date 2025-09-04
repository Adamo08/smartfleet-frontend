import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-spinner.html',
  styleUrl: './loading-spinner.css'
})
export class LoadingSpinner {
  @Input() message: string = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  getSpinnerClasses(): string {
    const baseClasses = 'border-4 border-gray-200 rounded-full animate-spin';
    switch (this.size) {
      case 'sm':
        return `w-6 h-6 ${baseClasses}`;
      case 'lg':
        return `w-16 h-16 ${baseClasses}`;
      default:
        return `w-12 h-12 ${baseClasses}`;
    }
  }

  getInnerSpinnerClasses(): string {
    const baseClasses = 'absolute top-0 left-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin';
    switch (this.size) {
      case 'sm':
        return `w-6 h-6 ${baseClasses}`;
      case 'lg':
        return `w-16 h-16 ${baseClasses}`;
      default:
        return `w-12 h-12 ${baseClasses}`;
    }
  }
}
