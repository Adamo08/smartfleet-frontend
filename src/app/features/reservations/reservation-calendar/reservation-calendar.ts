import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-reservation-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './reservation-calendar.html',
  styleUrl: './reservation-calendar.css'
})
export class ReservationCalendar {

}
