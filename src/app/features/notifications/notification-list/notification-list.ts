import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notification-list.html',
  styleUrl: './notification-list.css'
})
export class NotificationList {

}
