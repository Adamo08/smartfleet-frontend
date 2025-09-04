import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ErrorType = 'error' | 'warning' | 'info';

@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './error-message.html',
  styleUrl: './error-message.css'
})
export class ErrorMessage {
  @Input() type: ErrorType = 'error';
  @Input() title: string = '';
  @Input() message: string = '';
  @Input() details: string[] = [];
  @Input() showIcon: boolean = true;
  @Input() showClose: boolean = false;
  @Input() dismissible: boolean = false;
  
  @Output() close = new EventEmitter<void>();
  @Output() retry = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }

  onRetry() {
    this.retry.emit();
  }

  get containerClasses(): string {
    const baseClasses = 'border-l-4 p-4 rounded-lg';
    switch (this.type) {
      case 'error':
        return `${baseClasses} border-red-500 bg-red-50 text-red-800`;
      case 'warning':
        return `${baseClasses} border-yellow-500 bg-yellow-50 text-yellow-800`;
      case 'info':
        return `${baseClasses} border-blue-500 bg-blue-50 text-blue-800`;
      default:
        return `${baseClasses} border-red-500 bg-red-50 text-red-800`;
    }
  }

  get iconPath(): string {
    switch (this.type) {
      case 'error':
        return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'warning':
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
      case 'info':
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      default:
        return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  get iconColor(): string {
    switch (this.type) {
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-red-500';
    }
  }
}
