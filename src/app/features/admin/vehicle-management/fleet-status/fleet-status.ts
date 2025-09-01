import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VehicleService } from '../../../../core/services/vehicle';
import { Vehicle } from '../../../../core/models/vehicle.interface';
import { Page, Pageable } from '../../../../core/models/pagination.interface';
import { VehicleFilter } from '../../../../core/models/vehicle-filter.interface';
import { SkeletonPage } from '../../../../shared/components/skeleton-page/skeleton-page';
import { Pagination } from '../../../../shared/components/pagination/pagination';

@Component({
  selector: 'app-fleet-status',
  standalone: true,
  imports: [CommonModule, RouterModule, SkeletonPage, Pagination],
  templateUrl: './fleet-status.html',
  styleUrl: './fleet-status.css'
})
export class FleetStatus implements OnInit {
  vehiclesPage!: Page<Vehicle>;
  isLoading = false;

  // Pagination
  currentPage = 0;
  pageSize = 20;

  // Status summary
  statusSummary: { [key: string]: number } = {};

  constructor(private vehicleService: VehicleService) {}

  ngOnInit(): void {
    this.loadFleetStatus();
    this.loadStatusSummary();
  }

  loadFleetStatus(): void {
    this.isLoading = true;
    const pageable: Pageable = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: 'status',
      sortDirection: 'ASC'
    };

    const filters: VehicleFilter = {};

    this.vehicleService.getVehicles(pageable, filters).subscribe({
      next: (response) => {
        this.vehiclesPage = response;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading fleet status:', error);
        this.isLoading = false;
      }
    });
  }

  loadStatusSummary(): void {
    const statuses = ['AVAILABLE', 'RENTED', 'IN_MAINTENANCE', 'OUT_OF_SERVICE'];

    statuses.forEach(status => {
      const pageable: Pageable = { page: 0, size: 1, sortBy: 'id', sortDirection: 'ASC' };
      const filters: VehicleFilter = { status };
      this.vehicleService.getVehicles(pageable, filters).subscribe({
        next: (response) => {
          this.statusSummary[status] = response.totalElements;
        },
        error: (error) => {
          console.error(`Error loading count for status ${status}:`, error);
          this.statusSummary[status] = 0;
        }
      });
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadFleetStatus();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'RENTED':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'IN_MAINTENANCE':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'OUT_OF_SERVICE':
        return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  }

  getStatusDisplayName(status: string): string {
    switch (status) {
      case 'IN_MAINTENANCE':
        return 'In Maintenance';
      case 'OUT_OF_SERVICE':
        return 'Out of Service';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }
  }
}
