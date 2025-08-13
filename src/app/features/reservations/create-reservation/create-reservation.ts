import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-create-reservation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './create-reservation.html',
  styleUrl: './create-reservation.css'
})
export class CreateReservation {

}
