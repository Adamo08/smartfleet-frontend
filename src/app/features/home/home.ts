import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { VehicleService } from '../../core/services/vehicle';
import { VehicleDataService } from '../../core/services/vehicle-data.service';
import { FavoriteService, Favorite } from '../../core/services/favorite';
import { Vehicle } from '../../core/models/vehicle.interface';
import { VehicleBrand } from '../../core/models/vehicle-brand.interface';
import { VehicleCard } from '../vehicles/vehicle-card/vehicle-card';
import { User } from '../../core/models/user.interface';
import { Subscription } from 'rxjs';
import { VehicleFilter } from '../../core/models/vehicle-filter.interface';
import { Pageable } from '../../core/models/pagination.interface';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, VehicleCard],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  currentUser: User | null = null;
  featuredVehicles: Vehicle[] = [];
  vehicleBrands: VehicleBrand[] = [];
  favorites: Favorite[] = [];
  loading = true;
  brandsLoading = true;
  private userSubscription: Subscription | null = null;

  // Static service testimonials
  serviceTestimonials = [
    {
      id: 1,
      userName: "Sarah Johnson",
      title: "Amazing Service Experience",
      content: "SmartFleet has completely transformed how I rent vehicles. The booking process is seamless, the vehicles are always in perfect condition, and the customer service is outstanding. I've been using them for over a year now and couldn't be happier!",
      rating: 5
    },
    {
      id: 2,
      userName: "Michael Chen",
      title: "Best Vehicle Rental Platform",
      content: "I've tried many rental services, but SmartFleet stands out with their premium fleet, competitive pricing, and exceptional user experience. The app is intuitive and the real-time availability updates are a game-changer.",
      rating: 5
    },
    {
      id: 3,
      userName: "Emily Davis",
      title: "Reliable and Professional",
      content: "As a business traveler, I need reliability and professionalism. SmartFleet delivers both consistently. Their vehicles are well-maintained, the booking system is efficient, and their support team is always helpful.",
      rating: 4
    }
  ];

  constructor(
    private authService: AuthService,
    private vehicleService: VehicleService,
    private vehicleDataService: VehicleDataService,
    private favoriteService: FavoriteService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.checkAuthStatus();
    this.loadFeaturedVehicles();
    this.loadVehicleBrands();
    // Log the current user and authentication status
    console.log('🔧 HomeComponent initialized');
    console.log('🔧 Current User:', this.currentUser);
    console.log('🔧 Is Authenticated:', this.isAuthenticated);
  }

  // Updated to subscribe to the user data
  private checkAuthStatus(): void {
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAuthenticated = !!user; // Set isAuthenticated based on if a user exists
      console.log('🔧 User data updated:', this.currentUser);
      
      // Load favorites when user is authenticated
      if (this.isAuthenticated) {
        this.loadFavorites();
      } else {
        this.favorites = [];
      }
    });
  }

  private loadFeaturedVehicles(): void {
    const pageable: Pageable = { page: 0, size: 6, sortBy: 'createdAt', sortDirection: 'DESC' };
    const filters: VehicleFilter = {};
    this.vehicleService.getVehicles(pageable, filters).subscribe({
      next: (page) => {
        this.featuredVehicles = page.content;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading featured vehicles:', error);
        this.loading = false;
      }
    });
  }

  private loadVehicleBrands(): void {
    this.vehicleDataService.getActiveBrands().subscribe({
      next: (brands) => {
        this.vehicleBrands = brands.slice(0, 8); // Show first 8 brands
        this.brandsLoading = false;
      },
      error: (error) => {
        console.error('Error loading vehicle brands:', error);
        this.brandsLoading = false;
      }
    });
  }

  get isLoggedIn(): boolean {
    return this.isAuthenticated;
  }

  get userInitials(): string {
    if (this.currentUser) {
      const firstName = this.currentUser.firstName || '';
      const lastName = this.currentUser.lastName || '';
      return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    }
    return '';
  }

  getStarRating(rating: number): string[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating ? '★' : '☆');
    }
    return stars;
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

  isFavorite(vehicleId: number): boolean {
    return this.favorites.some(favorite => favorite.vehicleId === vehicleId);
  }

  onFavoriteToggled(vehicleId: number): void {
    if (!this.isAuthenticated) {
      this.toastr.info('Please log in to manage favorites', 'Login Required');
      return;
    }

    const vehicle = this.featuredVehicles.find(v => v.id === vehicleId);
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

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
}
