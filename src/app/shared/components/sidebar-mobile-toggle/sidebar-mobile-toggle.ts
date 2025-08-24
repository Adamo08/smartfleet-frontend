import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar-mobile-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar-mobile-toggle.html',
  styleUrl: './sidebar-mobile-toggle.css'
})
export class SidebarMobileToggleComponent {
  @Input() isSidebarCollapsed = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  onToggle(): void {
    this.toggleSidebar.emit();
  }
}
