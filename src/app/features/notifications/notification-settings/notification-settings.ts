import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-notification-settings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notification-settings.html',
  styleUrl: './notification-settings.css'
})
export class NotificationSettings {

}
