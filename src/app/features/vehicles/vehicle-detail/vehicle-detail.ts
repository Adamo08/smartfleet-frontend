import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { VehicleService } from '../../../core/services/vehicle';
import { FavoriteService, Favorite } from '../../../core/services/favorite';
import { TestimonialService, Testimonial } from '../../../core/services/testimonial';
import { AuthService } from '../../../core/services/auth';
import { Vehicle } from '../../../core/models/vehicle.interface';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-vehicle-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vehicle-detail.html',
  styleUrl: './vehicle-detail.css'
})
export class VehicleDetail implements OnInit {
  vehicle: Vehicle | null = null;
  vehicleTestimonials: Testimonial[] = [];
  similarVehicles: Vehicle[] = [];
  favorites: Favorite[] = [];
  loading = true;
  isLoggedIn = false;
  isFavorite = false;

  constructor(
    private route: ActivatedRoute,
    private vehicleService: VehicleService,
    private favoriteService: FavoriteService,
    private testimonialService: TestimonialService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isAuthenticated();
    this.loadVehicle();
    if (this.isLoggedIn) {
      this.loadFavorites();
    }
  }

  private loadVehicle(): void {
    const vehicleId = this.route.snapshot.paramMap.get('id');
    if (vehicleId) {
      this.vehicleService.getVehicleById(parseInt(vehicleId)).subscribe({
        next: (vehicle) => {
          this.vehicle = vehicle;
          this.loadVehicleTestimonials(vehicle.id);
          this.loadSimilarVehicles(vehicle);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading vehicle:', error);
          this.loading = false;
        }
      });
    }
  }

  private loadFavorites(): void {
    this.favoriteService.getMyFavorites().subscribe({
      next: (favorites) => {
        this.favorites = favorites;
        this.updateFavoriteStatus();
      },
      error: (error) => {
        console.error('Error loading favorites:', error);
      }
    });
  }

  private loadVehicleTestimonials(vehicleId: number): void {
    this.testimonialService.getPublicTestimonials({ vehicleId, page: 0, size: 6 }).subscribe({
      next: (testimonials) => {
        this.vehicleTestimonials = testimonials;
      },
      error: (error) => {
        console.error('Error loading vehicle testimonials:', error);
        // Load some mock testimonials for demonstration
        this.loadMockVehicleTestimonials();
      }
    });
  }

  private loadMockVehicleTestimonials(): void {
    if (this.vehicle) {
      this.vehicleTestimonials = [
        {
          id: 1,
          userId: 1,
          vehicleId: this.vehicle.id,
          title: "Excellent Vehicle Experience",
          content: "This {{ vehicle.brand }} {{ vehicle.model }} exceeded my expectations. Smooth ride, great fuel efficiency, and perfect for my business trips. Highly recommend!",
          rating: 5,
          approved: true,
          createdAt: "2024-01-15T10:00:00Z",
          updatedAt: "2024-01-15T10:00:00Z",
          userName: "John Smith",
          vehicleBrand: this.vehicle.brand,
          vehicleModel: this.vehicle.model
        },
        {
          id: 2,
          userId: 2,
          vehicleId: this.vehicle.id,
          title: "Great Performance",
          content: "Rented this {{ vehicle.brand }} {{ vehicle.model }} for a weekend trip. Comfortable, reliable, and the perfect size for our family. Will definitely rent again!",
          rating: 4,
          approved: true,
          createdAt: "2024-01-10T14:30:00Z",
          updatedAt: "2024-01-10T14:30:00Z",
          userName: "Maria Garcia",
          vehicleBrand: this.vehicle.brand,
          vehicleModel: this.vehicle.model
        }
      ];
    }
  }

  private loadSimilarVehicles(currentVehicle: Vehicle): void {
    // Load vehicles of the same type and similar price range
    this.vehicleService.searchVehicles({
      type: currentVehicle.vehicleType,
      minPrice: currentVehicle.pricePerDay * 0.7,
      maxPrice: currentVehicle.pricePerDay * 1.3,
      page: 0,
      size: 3
    }).subscribe({
      next: (vehicles) => {
        this.similarVehicles = vehicles.filter(v => v.id !== currentVehicle.id);
      },
      error: (error) => {
        console.error('Error loading similar vehicles:', error);
      }
    });
  }

  private updateFavoriteStatus(): void {
    if (this.vehicle) {
      this.isFavorite = this.favorites.some(favorite => favorite.vehicleId === this.vehicle!.id);
    }
  }

  toggleFavorite(): void {
    if (!this.vehicle) return;

    const vehicleName = `${this.vehicle.brand} ${this.vehicle.model}`;

    if (this.isFavorite) {
      // Remove from favorites
      const favorite = this.favorites.find(f => f.vehicleId === this.vehicle!.id);
      if (favorite) {
        this.favoriteService.deleteFavorite(favorite.id).subscribe({
          next: () => {
            this.favorites = this.favorites.filter(f => f.vehicleId !== this.vehicle!.id);
            this.isFavorite = false;
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
      this.favoriteService.addToFavorites(this.vehicle.id).subscribe({
        next: (favorite) => {
          this.favorites.push(favorite);
          this.isFavorite = true;
          this.toastr.success(`${vehicleName} added to favorites`, 'Favorite Added');
        },
        error: (error) => {
          console.error('Error adding to favorites:', error);
          this.toastr.error('Failed to add to favorites', 'Error');
        }
      });
    }
  }

  bookVehicle(): void {
    if (!this.vehicle) return;
    
    // Navigate to booking page or show booking modal
    console.log('Booking vehicle:', this.vehicle.id);
    // TODO: Implement booking functionality
    alert('Booking functionality will be implemented soon!');
  }

  checkAvailability(): void {
    if (!this.vehicle) return;
    
    // Check vehicle availability for specific dates
    console.log('Checking availability for vehicle:', this.vehicle.id);
    // TODO: Implement availability check
    alert('Availability check will be implemented soon!');
  }

  getStarRating(rating: number): string[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating ? '★' : '☆');
    }
    return stars;
  }
}
