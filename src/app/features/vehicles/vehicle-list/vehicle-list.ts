import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VehicleService } from '../../../core/services/vehicle';
import { FavoriteService, Favorite } from '../../../core/services/favorite';
import { AuthService } from '../../../core/services/auth';
import { Vehicle, VehicleType, VehicleStatus, FuelType } from '../../../core/models/vehicle.interface';
import { VehicleCard } from '../vehicle-card/vehicle-card';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, VehicleCard],
  templateUrl: './vehicle-list.html',
  styleUrl: './vehicle-list.css'
})
export class VehicleList implements OnInit {
  vehicles: Vehicle[] = [];
  filteredVehicles: Vehicle[] = [];
  favorites: Favorite[] = [];
  loading = true;
  isLoggedIn = false;

  // Search and filters
  searchTerm = '';
  selectedVehicleType = '';
  selectedStatus = '';
  selectedFuelType = '';
  maxPrice = '';
  minYear = '';
  maxMileage = '';
  sortBy = 'createdAt';

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
    this.vehicleService.getVehicles().subscribe({
      next: (vehicles) => {
        this.vehicles = vehicles;
        this.filteredVehicles = [...vehicles];
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
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedVehicleType = '';
    this.selectedStatus = '';
    this.selectedFuelType = '';
    this.maxPrice = '';
    this.minYear = '';
    this.maxMileage = '';
    this.sortBy = 'createdAt';
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.vehicles];

    // Search filter
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(vehicle =>
        vehicle.brand.toLowerCase().includes(search) ||
        vehicle.model.toLowerCase().includes(search) ||
        vehicle.licensePlate.toLowerCase().includes(search)
      );
    }

    // Vehicle type filter
    if (this.selectedVehicleType) {
      filtered = filtered.filter(vehicle => vehicle.vehicleType === this.selectedVehicleType);
    }

    // Status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(vehicle => vehicle.status === this.selectedStatus);
    }

    // Fuel type filter
    if (this.selectedFuelType) {
      filtered = filtered.filter(vehicle => vehicle.fuelType === this.selectedFuelType);
    }

    // Price filter
    if (this.maxPrice) {
      const maxPrice = parseFloat(this.maxPrice);
      filtered = filtered.filter(vehicle => vehicle.pricePerDay <= maxPrice);
    }

    // Year filter
    if (this.minYear) {
      const minYear = parseInt(this.minYear);
      filtered = filtered.filter(vehicle => vehicle.year >= minYear);
    }

    // Mileage filter
    if (this.maxMileage) {
      const maxMileage = parseFloat(this.maxMileage);
      filtered = filtered.filter(vehicle => vehicle.mileage <= maxMileage);
    }

    // Sort
    this.sortVehicles(filtered);

    this.filteredVehicles = filtered;
  }

  private sortVehicles(vehicles: Vehicle[]): void {
    switch (this.sortBy) {
      case 'pricePerDay':
        vehicles.sort((a, b) => a.pricePerDay - b.pricePerDay);
        break;
      case 'pricePerDay_desc':
        vehicles.sort((a, b) => b.pricePerDay - a.pricePerDay);
        break;
      case 'year':
        vehicles.sort((a, b) => b.year - a.year);
        break;
      case 'mileage':
        vehicles.sort((a, b) => a.mileage - b.mileage);
        break;
      case 'createdAt':
      default:
        vehicles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }
  }

  isFavorite(vehicleId: number): boolean {
    return this.favorites.some(favorite => favorite.vehicleId === vehicleId);
  }

  toggleFavorite(vehicleId: number): void {
    const vehicle = this.vehicles.find(v => v.id === vehicleId);
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
