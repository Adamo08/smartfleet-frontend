import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-vehicle-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vehicle-card.html',
  styleUrl: './vehicle-card.css'
})
export class VehicleCard {

}
