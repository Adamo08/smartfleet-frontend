import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { VehicleService } from '../../core/services/vehicle';
import { Vehicle } from '../../core/models/vehicle.interface';
import { VehicleCard } from '../vehicles/vehicle-card/vehicle-card';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, VehicleCard],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit {
  isAuthenticated = false;
  currentUser: any = null;
  featuredVehicles: Vehicle[] = [];
  loading = true;

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
    private vehicleService: VehicleService
  ) {}

  ngOnInit(): void {
    this.checkAuthStatus();
    this.loadFeaturedVehicles();
  }

  private checkAuthStatus(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    if (this.isAuthenticated) {
      this.currentUser = this.authService.getCurrentUser();
    }
  }

  private loadFeaturedVehicles(): void {
    this.vehicleService.getVehicles({ page: 0, size: 6 }).subscribe({
      next: (vehicles) => {
        this.featuredVehicles = vehicles;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading featured vehicles:', error);
        this.loading = false;
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

  onFavoriteToggled(vehicleId: number): void {
    // Handle favorite toggle for featured vehicles
    console.log('Favorite toggled for vehicle:', vehicleId);
  }
}
