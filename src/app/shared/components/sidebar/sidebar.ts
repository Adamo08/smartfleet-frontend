import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  currentUser: any = null;
  collapsed = false;
  isMobile = false; // Add this property
  @Output() collapsedChange = new EventEmitter<boolean>();

  constructor(private authService: AuthService) {
    this.currentUser = this.authService.getCurrentUser();
    // Auto-collapse on small screens
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  private checkScreenSize(): void {
    const isMobile = window.innerWidth < 768; // md breakpoint
    this.isMobile = isMobile; // Update isMobile property
    if (isMobile && !this.collapsed) {
      this.collapsed = true;
      this.collapsedChange.emit(this.collapsed);
    } else if (!isMobile && this.collapsed && !this.manualCollapse) {
      this.collapsed = false;
      this.collapsedChange.emit(this.collapsed);
    }
  }

  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    this.manualCollapse = this.collapsed; // Track manual collapse state
    this.collapsedChange.emit(this.collapsed);
  }

  protected readonly window = window;
  private manualCollapse = false; // New property to track manual collapse
}
