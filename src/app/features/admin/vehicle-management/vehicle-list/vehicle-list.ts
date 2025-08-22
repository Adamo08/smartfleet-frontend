import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VehicleService } from '../../../../core/services/vehicle';
import { Vehicle } from '../../../../core/models/vehicle.interface';
import { Page, Pageable, Sort } from '../../../../core/models/pagination.interface';
import { Modal } from '../../../../shared/components/modal/modal';
import { ConfigrmDialog, DialogActionType } from '../../../../shared/components/configrm-dialog/configrm-dialog';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { RouterModule } from '@angular/router';
import { VehicleDetail } from '../vehicle-detail/vehicle-detail';
import { VehicleForm } from '../vehicle-form/vehicle-form';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [CommonModule, RouterModule, Modal, ConfigrmDialog, Pagination, VehicleDetail, VehicleForm],
  templateUrl: './vehicle-list.html',
  styleUrl: './vehicle-list.css'
})
export class VehicleList implements OnInit {
  vehiclesPage!: Page<Vehicle>;
  isLoading = false;
  currentPage = 0;
  pageSize = 10;
  sortBy = 'id';
  sortDirection: 'ASC' | 'DESC' = 'ASC';

  selectedVehicle: Vehicle | null = null;
  showVehicleDetailModal = false;
  showAddVehicleModal = false;
  showEditVehicleModal = false;
  showDeleteVehicleModal = false;
  vehicleToDelete: Vehicle | null = null;

  // Expose DialogActionType to the template
  readonly DialogActionType = DialogActionType;

  constructor(private vehicleService: VehicleService) {}

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.isLoading = true;
    const pageable: Pageable = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };

    this.vehicleService.getVehicles(pageable).subscribe({
      next: (page) => {
        this.vehiclesPage = page;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadVehicles();
  }

  onSortChange(sortBy: string, sortDirection: 'ASC' | 'DESC'): void {
    this.sortBy = sortBy;
    this.sortDirection = sortDirection;
    this.loadVehicles();
  }

  viewVehicle(vehicle: Vehicle): void {
    this.selectedVehicle = vehicle;
    this.showVehicleDetailModal = true;
  }

  closeVehicleDetailModal(): void {
    this.showVehicleDetailModal = false;
    this.selectedVehicle = null;
  }

  openAddVehicleModal(): void {
    this.selectedVehicle = null; // Ensure no vehicle is selected for adding
    this.showAddVehicleModal = true;
  }

  closeAddVehicleModal(): void {
    this.showAddVehicleModal = false;
    this.loadVehicles();
  }

  openEditVehicleModal(vehicle: Vehicle): void {
    this.selectedVehicle = vehicle;
    this.showEditVehicleModal = true;
  }

  closeEditVehicleModal(): void {
    this.showEditVehicleModal = false;
    this.selectedVehicle = null;
    this.loadVehicles();
  }

  openDeleteVehicleModal(vehicle: Vehicle): void {
    this.vehicleToDelete = vehicle;
    this.showDeleteVehicleModal = true;
  }

  confirmDeleteVehicle(): void {
    if (this.vehicleToDelete) {
      this.vehicleService.deleteVehicle(this.vehicleToDelete.id!).subscribe({
        next: () => {
          this.closeDeleteVehicleModal();
          this.loadVehicles();
        },
        error: (err) => console.error('Error deleting vehicle:', err)
      });
    }
  }

  closeDeleteVehicleModal(): void {
    this.showDeleteVehicleModal = false;
    this.vehicleToDelete = null;
  }
}
