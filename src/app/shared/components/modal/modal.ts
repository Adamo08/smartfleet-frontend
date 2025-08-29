import { Component, EventEmitter, Input, Output, AfterContentInit, ContentChild, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.html',
  styleUrl: './modal.css',
  host: {}
})
export class Modal implements AfterContentInit {
  @Input() title: string = '';
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() showCloseButton: boolean = true;
  @Input() backdrop: boolean = true;
  @Input() backdropClose: boolean = true;
  @Input() closeOnEscape: boolean = true;
  
  @Output() close = new EventEmitter<void>();
  @Output() open = new EventEmitter<void>();

  @ContentChild('[modal-actions]', { static: false }) footerContent?: ElementRef;
  @ViewChild('.modal-container', { static: false }) modalContainer?: ElementRef;

  hasFooterContent = false;
  private isExiting = false;

  ngAfterContentInit(): void {
    this.hasFooterContent = !!this.footerContent;
    this.open.emit();
    
    // Focus management for accessibility
    setTimeout(() => {
      this.focusModal();
    }, 100);
  }

  onBackdropClick(event: Event): void {
    if (this.backdropClose && !this.isExiting) {
      this.closeModal();
    }
  }

  onClose(): void {
    if (!this.isExiting) {
      this.closeModal();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (this.closeOnEscape && !this.isExiting) {
      keyboardEvent.preventDefault();
      this.closeModal();
    }
  }

  private closeModal(): void {
    if (this.isExiting) return;
    
    this.isExiting = true;
    
    // Add exit animation class
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
      overlay.classList.add('exiting');
    }
    
    // Wait for animation to complete before emitting close event
    setTimeout(() => {
      this.close.emit();
    }, 200);
  }

  private focusModal(): void {
    if (this.modalContainer?.nativeElement) {
      this.modalContainer.nativeElement.focus();
    }
  }

  getModalTitleId(): string {
    return 'modal-title-' + this.title.replace(/\s+/g, '-').toLowerCase();
  }

  // Trap focus within modal for accessibility
  @HostListener('keydown.tab', ['$event'])
  onTabKey(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    const modal = this.modalContainer?.nativeElement;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (keyboardEvent.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        keyboardEvent.preventDefault();
        lastFocusable.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        keyboardEvent.preventDefault();
        firstFocusable.focus();
      }
    }
  }
}