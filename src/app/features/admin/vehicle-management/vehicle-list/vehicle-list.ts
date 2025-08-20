import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VehicleService } from '../../../../core/services/vehicle';
import { Vehicle } from '../../../../core/models/vehicle.interface';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vehicle-list.html',
  styleUrl: './vehicle-list.css'
})
export class VehicleList implements OnInit {
  vehicles: Vehicle[] = [];
  isLoading = false;

  constructor(private vehicleService: VehicleService) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.vehicleService.getVehicles({ page: 0, size: 20 }).subscribe({
      next: (res) => { this.vehicles = res; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }
}
