import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrl: './toast.css'
})
export class Toast implements OnInit {
  @Input() type: ToastType = 'info';
  @Input() title: string = '';
  @Input() message: string = '';
  @Input() duration: number = 5000;
  @Input() showClose: boolean = true;
  @Output() close = new EventEmitter<void>();

  ngOnInit() {
    if (this.duration > 0) {
      setTimeout(() => {
        this.onClose();
      }, this.duration);
    }
  }

  onClose() {
    this.close.emit();
  }

  get toastIcon() {
    switch (this.type) {
      case 'success':
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'error':
        return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'warning':
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
      case 'info':
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      default:
        return '';
    }
  }

  get toastClasses() {
    const baseClasses = 'border-l-4';
    switch (this.type) {
      case 'success':
        return `${baseClasses} border-green-500 bg-green-50 text-green-800`;
      case 'error':
        return `${baseClasses} border-red-500 bg-red-50 text-red-800`;
      case 'warning':
        return `${baseClasses} border-yellow-500 bg-yellow-50 text-yellow-800`;
      case 'info':
        return `${baseClasses} border-blue-500 bg-blue-50 text-blue-800`;
      default:
        return `${baseClasses} border-gray-500 bg-gray-50 text-gray-800`;
    }
  }

  get iconColor() {
    switch (this.type) {
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  }
}
