import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../../core/services/notification';

@Component({
  selector: 'app-templates',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './templates.html',
  styleUrl: './templates.css'
})
export class Templates implements OnInit {
  types: string[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    // For now, show enum values from frontend service; could be replaced by backend endpoint to list templates
    this.types = Object.keys((NotificationService as any).prototype.constructor); // placeholder, not used in template
  }
}
