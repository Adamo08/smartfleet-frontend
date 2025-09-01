import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VehicleService } from '../../../../core/services/vehicle';
import { EnumService, EnumOption } from '../../../../core/services/enum.service';
import { Vehicle } from '../../../../core/models/vehicle.interface';
import { Page, Pageable, Sort } from '../../../../core/models/pagination.interface';
import { Modal } from '../../../../shared/components/modal/modal';
import { ConfigrmDialog, DialogActionType } from '../../../../shared/components/configrm-dialog/configrm-dialog';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { RouterModule } from '@angular/router';
import { VehicleDetail } from '../vehicle-detail/vehicle-detail';
import { VehicleForm } from '../vehicle-form/vehicle-form';
import { ApiService } from '../../../../core/services/api';
import { VehicleFilter } from '../../../../core/models/vehicle-filter.interface';
import { VehicleBrand } from '../../../../core/models/vehicle-brand.interface';
import { VehicleModel } from '../../../../core/models/vehicle-model.interface';
import { VehicleCategory } from '../../../../core/models/vehicle-category.interface';
import { ActionIcons } from '../../../../shared/components/action-icons/action-icons';
import { SuccessModalService } from '../../../../shared/services/success-modal.service';
import { SkeletonPage } from '../../../../shared/components/skeleton-page/skeleton-page';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Modal, ConfigrmDialog, Pagination, VehicleDetail, VehicleForm, ActionIcons, SkeletonPage],
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

  // Dynamic enum options
  categories: VehicleCategory[] = [];
  fuelTypes: EnumOption[] = [];
  vehicleStatuses: EnumOption[] = [];
  brands: VehicleBrand[] = [];
  models: VehicleModel[] = [];

  filters = {
    search: '',
    categoryId: '' as string | number, // Changed to support empty string default
    fuelType: '',
    status: '',
    brandId: '' as string | number, // Changed to support empty string default
    modelId: '' as string | number, // Changed to support empty string default
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    minYear: undefined as number | undefined,
    maxYear: undefined as number | undefined,
    minMileage: undefined as number | undefined,
    maxMileage: undefined as number | undefined
  };

  selectedVehicle: Vehicle | null = null;
  showVehicleDetailModal = false;
  showAddVehicleModal = false;
  showEditVehicleModal = false;
  showDeleteVehicleModal = false;
  vehicleToDelete: Vehicle | null = null;

  // Expose DialogActionType to the template
  readonly DialogActionType = DialogActionType;

  constructor(
    private vehicleService: VehicleService,
    private enumService: EnumService,
    private apiService: ApiService,
    private successModalService: SuccessModalService
  ) {}

  ngOnInit(): void {
    this.loadEnumOptions();
    this.loadFilterOptions();
    this.loadVehicles();
  }

  loadEnumOptions(): void {
    this.enumService.getFuelTypes().subscribe(types => this.fuelTypes = types);
    this.enumService.getVehicleStatuses().subscribe(statuses => this.vehicleStatuses = statuses);
  }

  private loadFilterOptions(): void {
    this.vehicleService.getAllVehicleCategories().subscribe({
      next: (page) => this.categories = page.content,
      error: (error) => console.error('Error loading categories:', error)
    });
    this.vehicleService.getAllVehicleBrands().subscribe({
      next: (page) => this.brands = page.content,
      error: (error) => console.error('Error loading brands:', error)
    });
    this.vehicleService.getAllVehicleModels().subscribe({
      next: (page) => this.models = page.content,
      error: (error) => console.error('Error loading models:', error)
    });
  }

  loadVehicles(): void {
    this.isLoading = true;
    const pageable: Pageable = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };

    const filters: VehicleFilter = {
      search: this.filters.search || undefined,
      categoryId: this.filters.categoryId ? Number(this.filters.categoryId) : undefined,
      fuelType: this.filters.fuelType || undefined,
      status: this.filters.status || undefined,
      brandId: this.filters.brandId ? Number(this.filters.brandId) : undefined,
      modelId: this.filters.modelId ? Number(this.filters.modelId) : undefined,
      minPrice: this.filters.minPrice || undefined,
      maxPrice: this.filters.maxPrice || undefined,
      minYear: this.filters.minYear || undefined,
      maxYear: this.filters.maxYear || undefined,
      minMileage: this.filters.minMileage || undefined,
      maxMileage: this.filters.maxMileage || undefined
    };

    this.vehicleService.getVehicles(
      pageable,
      filters
    ).subscribe({
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

  applyFilters(): void {
    this.currentPage = 0; // Reset to first page when filters change
    this.loadVehicles();
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      categoryId: '', // Reset to empty string to match HTML default
      fuelType: '',
      status: '',
      brandId: '', // Reset to empty string to match HTML default
      modelId: '', // Reset to empty string to match HTML default
      minPrice: undefined,
      maxPrice: undefined,
      minYear: undefined,
      maxYear: undefined,
      minMileage: undefined,
      maxMileage: undefined
    };
    this.currentPage = 0;
    this.loadVehicles();
  }

  exportToCSV(): void {
    // TODO: Implement CSV export functionality
    console.log('Exporting to CSV...');
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
          this.successModalService.showEntityDeleted('Vehicle', `Vehicle ${this.vehicleToDelete!.licensePlate} has been successfully deleted`);
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
