import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './reservation-list.html',
  styleUrl: './reservation-list.css'
})
export class ReservationList {

}
