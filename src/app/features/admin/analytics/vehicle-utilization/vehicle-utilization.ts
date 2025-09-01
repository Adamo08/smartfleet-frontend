import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VehicleAnalytics } from '../../../../shared/components/vehicle-analytics/vehicle-analytics';

@Component({
  selector: 'app-vehicle-utilization',
  standalone: true,
  imports: [CommonModule, RouterModule, VehicleAnalytics],
  templateUrl: './vehicle-utilization.html',
  styleUrl: './vehicle-utilization.css'
})
export class VehicleUtilization {

}
