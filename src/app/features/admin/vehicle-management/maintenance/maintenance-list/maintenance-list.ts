import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VehicleService } from '../../../../../core/services/vehicle';
import { Vehicle } from '../../../../../core/models/vehicle.interface';
import { Page, Pageable } from '../../../../../core/models/pagination.interface';
import { VehicleStatus } from '../../../../../core/models/vehicle.interface';
import { VehicleFilter } from '../../../../../core/models/vehicle-filter.interface';
import { SkeletonPage } from '../../../../../shared/components/skeleton-page/skeleton-page';
import { Pagination } from '../../../../../shared/components/pagination/pagination';
import { ActionIcons } from '../../../../../shared/components/action-icons/action-icons';
import { SuccessModalService } from '../../../../../shared/services/success-modal.service';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-maintenance-list',
  imports: [CommonModule, RouterModule, FormsModule, SkeletonPage, Pagination, ActionIcons],
  templateUrl: './maintenance-list.html',
  styleUrl: './maintenance-list.css'
})
export class MaintenanceList implements OnInit {
  vehiclesPage!: Page<Vehicle>;
  isLoading = false;

  // Pagination
  currentPage = 0;
  pageSize = 10;

  // Filters
  searchTerm = '';
  selectedStatus = '';

  // Status counts cache
  statusCounts: { [key: string]: number } = {};

  // Search debounce
  private searchSubject = new Subject<string>();

  constructor(
    private vehicleService: VehicleService,
    private successModalService: SuccessModalService,
    private toastr: ToastrService
  ) {
    // Setup search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.loadVehicles();
    });
  }

  ngOnInit(): void {
    this.loadVehicles();
    this.loadStatusCounts();
  }

  loadVehicles(): void {
    this.isLoading = true;
    const pageable: Pageable = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: 'updatedAt',
      sortDirection: 'DESC'
    };

    // Build filters
    const filters: VehicleFilter = {
      search: this.searchTerm || undefined,
      status: this.selectedStatus || undefined
    };

    this.vehicleService.getVehicles(pageable, filters).subscribe({
      next: (response) => {
        this.vehiclesPage = response;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading vehicles:', error);
        this.toastr.error('Failed to load vehicles');
        this.isLoading = false;
      }
    });
  }

  loadStatusCounts(): void {
    // Load counts for each status
    const statuses = ['IN_MAINTENANCE', 'OUT_OF_SERVICE', 'DAMAGED', 'AVAILABLE', 'RENTED'];

    statuses.forEach(status => {
      const pageable: Pageable = { page: 0, size: 1, sortBy: 'id', sortDirection: 'ASC' };
      const filters: VehicleFilter = { status };
      this.vehicleService.getVehicles(pageable, filters).subscribe({
        next: (response) => {
          this.statusCounts[status] = response.totalElements;
        },
        error: (error) => {
          console.error(`Error loading count for status ${status}:`, error);
          this.statusCounts[status] = 0;
        }
      });
    });
  }

  getVehicleCountByStatus(status: string): number {
    return this.statusCounts[status] || 0;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadVehicles();
  }

  onSearchChange(): void {
    this.currentPage = 0;
    this.searchSubject.next(this.searchTerm);
  }

  onStatusFilterChange(): void {
    this.currentPage = 0;
    this.loadVehicles();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.currentPage = 0;
    this.loadVehicles();
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
      case 'DAMAGED':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
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

  markForMaintenance(vehicle: Vehicle): void {
    if (!vehicle.id) return;

    const updateData: Partial<Vehicle> = { status: VehicleStatus.IN_MAINTENANCE };
    this.vehicleService.updateVehicle(vehicle.id, updateData).subscribe({
      next: () => {
        this.successModalService.show({
          title: 'Vehicle Marked for Maintenance',
          message: `${vehicle.brandName} ${vehicle.modelName} has been marked for maintenance.`,
          details: `License Plate: ${vehicle.licensePlate}`,
          autoClose: true,
          autoCloseDelay: 3000
        });
        this.loadVehicles();
        this.loadStatusCounts();
      },
      error: (error: any) => {
        console.error('Error marking vehicle for maintenance:', error);
        this.toastr.error('Failed to mark vehicle for maintenance');
      }
    });
  }

  markAsAvailable(vehicle: Vehicle): void {
    if (!vehicle.id) return;

    const updateData: Partial<Vehicle> = { status: VehicleStatus.AVAILABLE };
    this.vehicleService.updateVehicle(vehicle.id, updateData).subscribe({
      next: () => {
        this.successModalService.show({
          title: 'Vehicle Marked as Available',
          message: `${vehicle.brandName} ${vehicle.modelName} is now available for rent.`,
          details: `License Plate: ${vehicle.licensePlate}`,
          autoClose: true,
          autoCloseDelay: 3000
        });
        this.loadVehicles();
        this.loadStatusCounts();
      },
      error: (error: any) => {
        console.error('Error marking vehicle as available:', error);
        this.toastr.error('Failed to mark vehicle as available');
      }
    });
  }

  viewVehicle(vehicle: Vehicle): void {
    // Navigate to vehicle details or open modal
    // This would typically open a vehicle details modal or navigate to a details page
    console.log('View vehicle:', vehicle);
    // Example: this.router.navigate(['/admin/vehicles', vehicle.id]);
  }

  openStatusChangeModal(vehicle: Vehicle): void {
    // Open a modal to change vehicle status
    console.log('Change status for vehicle:', vehicle);
    // This would open a modal with status options
  }

  openScheduleMaintenanceModal(): void {
    // Open a modal to schedule maintenance for a vehicle
    console.log('Schedule maintenance modal');
    // This would open a modal to select a vehicle and schedule maintenance
  }
}
