import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-vehicle-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vehicle-detail.html',
  styleUrl: './vehicle-detail.css'
})
export class VehicleDetail {

}
