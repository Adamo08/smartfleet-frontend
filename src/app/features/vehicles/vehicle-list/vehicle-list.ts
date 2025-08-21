import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VehicleService } from '../../../core/services/vehicle';
import { FavoriteService, Favorite } from '../../../core/services/favorite';
import { AuthService } from '../../../core/services/auth';
import { Vehicle, VehicleType, VehicleStatus, FuelType } from '../../../core/models/vehicle.interface';
import { Page, Pageable, Sort } from '../../../core/models/pagination.interface';
import { VehicleCard } from '../vehicle-card/vehicle-card';
import { ToastrService } from 'ngx-toastr';
import { Modal } from '../../../shared/components/modal/modal';
import { VehicleDetail } from '../vehicle-detail/vehicle-detail';
import { Pagination } from '../../../shared/components/pagination/pagination';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, VehicleCard, Modal, VehicleDetail, Pagination],
  templateUrl: './vehicle-list.html',
  styleUrl: './vehicle-list.css'
})
export class VehicleList implements OnInit {
  vehiclesPage!: Page<Vehicle>;
  favorites: Favorite[] = [];
  loading = true;
  isLoggedIn = false;

  // Pagination properties
  currentPage = 0;
  pageSize = 9; // Display 9 vehicles per page in the grid
  sortBy = 'createdAt';
  sortDirection: 'ASC' | 'DESC' = 'DESC';

  // Filter properties
  searchTerm = '';
  selectedVehicleType: string | null = null;
  selectedStatus: string | null = null;
  selectedFuelType: string | null = null;
  maxPrice: number | null = null;
  minYear: number | null = null;
  maxMileage: number | null = null;

  // Enums for dropdowns
  readonly VehicleType = Object.values(VehicleType);
  readonly FuelType = Object.values(FuelType);
  readonly VehicleStatus = Object.values(VehicleStatus);

  selectedVehicle: Vehicle | null = null;
  showVehicleDetailModal = false;

  constructor(
    private vehicleService: VehicleService,
    private favoriteService: FavoriteService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isAuthenticated();
    this.loadVehicles();
    if (this.isLoggedIn) {
      this.loadFavorites();
    }
  }

  private loadVehicles(): void {
    this.loading = true;

    const pageable: Pageable = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.sortBy.includes('_desc') ? this.sortBy.replace('_desc', '') : this.sortBy,
      sortDirection: this.sortBy.includes('_desc') ? 'DESC' : 'ASC'
    };

    const filters = {
      brand: this.searchTerm || null,
      model: this.searchTerm || null, // Assuming search term can apply to brand or model
      vehicleType: this.selectedVehicleType,
      fuelType: this.selectedFuelType,
      status: this.selectedStatus,
      minPrice: null, // minPrice is not used in the current UI dropdowns
      maxPrice: this.maxPrice,
      minYear: this.minYear,
      maxMileage: this.maxMileage
    };

    // Remove null or empty string filters to avoid sending them to backend
    Object.keys(filters).forEach(key => (filters[key as keyof typeof filters] === null || filters[key as keyof typeof filters] === '') && delete filters[key as keyof typeof filters]);

    this.vehicleService.getVehicles({ ...pageable, ...filters }).subscribe({
      next: (page) => {
        this.vehiclesPage = page;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading vehicles:', error);
        this.loading = false;
      }
    });
  }

  private loadFavorites(): void {
    this.favoriteService.getMyFavorites().subscribe({
      next: (favorites) => {
        this.favorites = favorites;
      },
      error: (error) => {
        console.error('Error loading favorites:', error);
      }
    });
  }

  onSearchChange(): void {
    this.currentPage = 0; // Reset to first page on new search
    this.loadVehicles();
  }

  onFilterChange(): void {
    this.currentPage = 0; // Reset to first page on new filter
    this.loadVehicles();
  }

  onSortChange(): void {
    this.currentPage = 0; // Reset to first page on new sort
    this.loadVehicles();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadVehicles();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedVehicleType = null;
    this.selectedStatus = null;
    this.selectedFuelType = null;
    this.maxPrice = null;
    this.minYear = null;
    this.maxMileage = null;
    this.sortBy = 'createdAt';
    this.currentPage = 0;
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

  isFavorite(vehicleId: number): boolean {
    return this.favorites.some(favorite => favorite.vehicleId === vehicleId);
  }

  toggleFavorite(vehicleId: number): void {
    const vehicle = this.vehiclesPage.content.find(v => v.id === vehicleId);
    const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Vehicle';

    if (this.isFavorite(vehicleId)) {
      // Remove from favorites
      const favorite = this.favorites.find(f => f.vehicleId === vehicleId);
      if (favorite) {
        this.favoriteService.deleteFavorite(favorite.id).subscribe({
          next: () => {
            this.favorites = this.favorites.filter(f => f.vehicleId !== vehicleId);
            this.toastr.success(`${vehicleName} removed from favorites`, 'Favorite Removed');
          },
          error: (error) => {
            console.error('Error removing from favorites:', error);
            this.toastr.error('Failed to remove from favorites', 'Error');
          }
        });
      }
    } else {
      // Add to favorites
      this.favoriteService.addToFavorites(vehicleId).subscribe({
        next: (favorite) => {
          this.favorites.push(favorite);
          this.toastr.success(`${vehicleName} added to favorites`, 'Favorite Added');
        },
        error: (error) => {
          console.error('Error adding to favorites:', error);
          this.toastr.error('Failed to add to favorites', 'Error');
        }
      });
    }
  }
}
