import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { VehicleService } from '../../../core/services/vehicle';
import { FavoriteService, Favorite } from '../../../core/services/favorite';
import { TestimonialService, Testimonial } from '../../../core/services/testimonial';
import { AuthService } from '../../../core/services/auth';
import { Vehicle } from '../../../core/models/vehicle.interface';
import { Page, Pageable } from '../../../core/models/pagination.interface'; // Import Page and Pageable
import { ToastrService } from 'ngx-toastr';
import { Modal } from '../../../shared/components/modal/modal';
import { SlotSelector } from '../../reservations/slot-selector/slot-selector';
import { ReservationService } from '../../../core/services/reservation.service';
import { PaymentService } from '../../../core/services/payment.service';
import { SlotDto } from '../../../core/models/slot.interface';
import { CreateReservationRequest } from '../../../core/models/reservation.interface';
import { Input } from '@angular/core';
import { VehicleFilter } from '../../../core/models/vehicle-filter.interface';

@Component({
  selector: 'app-vehicle-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, Modal, SlotSelector],
  templateUrl: './vehicle-detail.html',
  styleUrl: './vehicle-detail.css'
})
export class VehicleDetail implements OnInit {
  @Input() vehicle: Vehicle | null = null;
  vehicleTestimonials: Testimonial[] = [];
  similarVehicles: Vehicle[] = [];
  favorites: Favorite[] = [];
  loading = true;
  isLoggedIn = false;
  isFavorite = false;
  isBookingOpen = false;
  selectedSlot: SlotDto | null = null;
  isSubmitting = false;

  constructor(
    private route: ActivatedRoute,
    private vehicleService: VehicleService,
    private favoriteService: FavoriteService,
    private testimonialService: TestimonialService,
    private authService: AuthService,
    private toastr: ToastrService,
    private reservationService: ReservationService,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    // If vehicle is passed as an input, we don't need to load it from route params
    if (!this.vehicle) {
      this.loadVehicleFromRoute();
    } else {
      // If vehicle is passed as input, proceed with related data loading
      this.loadVehicleTestimonials(this.vehicle.id);
      this.loadSimilarVehicles(this.vehicle);
      this.loading = false;
    }

    this.isLoggedIn = this.authService.isAuthenticated();
    if (this.isLoggedIn) {
      this.loadFavorites();
    }
  }

  private loadVehicleFromRoute(): void {
    const vehicleId = this.route.snapshot.paramMap.get('id');
    if (vehicleId) {
      this.vehicleService.getVehicleById(parseInt(vehicleId)).subscribe({
        next: (vehicle: Vehicle) => { // Explicitly type 'vehicle'
          this.vehicle = vehicle;
          this.loadVehicleTestimonials(vehicle.id);
          this.loadSimilarVehicles(vehicle);
          this.loading = false;
        },
        error: (error: any) => { // Explicitly type 'error'
          console.error('Error loading vehicle:', error);
          this.loading = false;
        }
      });
    }
  }

  private loadFavorites(): void {
    this.favoriteService.getMyFavorites().subscribe({
      next: (favorites: Favorite[]) => { // Explicitly type 'favorites'
        this.favorites = favorites;
        this.updateFavoriteStatus();
      },
      error: (error: any) => { // Explicitly type 'error'
        console.error('Error loading favorites:', error);
      }
    });
  }

  private loadVehicleTestimonials(vehicleId: number): void {
    this.testimonialService.getPublicTestimonials({ vehicleId, page: 0, size: 6 }).subscribe({
      next: (testimonials: Testimonial[]) => { // Explicitly type 'testimonials'
        this.vehicleTestimonials = testimonials;
      },
      error: (error: any) => { // Explicitly type 'error'
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
    const pageable: Pageable = {
      page: 0,
      size: 4,
      sortBy: 'pricePerDay',
      sortDirection: 'ASC'
    };

    const filters: VehicleFilter = {
      categoryId: currentVehicle.categoryId || undefined,
      minPrice: currentVehicle.pricePerDay ? currentVehicle.pricePerDay * 0.7 : undefined,
      maxPrice: currentVehicle.pricePerDay ? currentVehicle.pricePerDay * 1.3 : undefined,
    };

    this.vehicleService.getVehicles(pageable, filters).subscribe({
      next: (page: Page<Vehicle>) => { // Explicitly type 'page'
        this.similarVehicles = page.content.filter((v: Vehicle) => v.id !== currentVehicle.id).slice(0, 3); // Explicitly type 'v'
      },
      error: (error: any) => { // Explicitly type 'error'
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
          error: (error: any) => { // Explicitly type 'error'
            console.error('Error removing from favorites:', error);
            this.toastr.error('Failed to remove from favorites', 'Error');
          }
        });
      }
    } else {
      // Add to favorites
      this.favoriteService.addToFavorites(this.vehicle.id).subscribe({
        next: (favorite: Favorite) => { // Explicitly type 'favorite'
          this.favorites.push(favorite);
          this.isFavorite = true;
          this.toastr.success(`${vehicleName} added to favorites`, 'Favorite Added');
        },
        error: (error: any) => { // Explicitly type 'error'
          console.error('Error adding to favorites:', error);
          this.toastr.error('Failed to add to favorites', 'Error');
        }
      });
    }
  }

  bookVehicle(): void {
    if (!this.vehicle) return;
    this.selectedSlot = null;
    this.isBookingOpen = true;
  }

  checkAvailability(): void {
    if (!this.vehicle) return;

    // Check vehicle availability for specific dates
    console.log('Checking availability for vehicle:', this.vehicle.id);
    // TODO: Implement availability check
    alert('Availability check will be implemented soon!');
  }

  onSlotSelected(slot: SlotDto): void {
    this.selectedSlot = slot;
  }

  closeBooking(): void {
    this.isBookingOpen = false;
    this.selectedSlot = null;
  }

  confirmBooking(): void {
    if (!this.vehicle || !this.selectedSlot || this.isSubmitting) return;
    this.isSubmitting = true;

    const request: CreateReservationRequest = {
      vehicleId: this.vehicle.id,
      slotId: this.selectedSlot.id,
      startDate: new Date(this.selectedSlot.startTime),
      endDate: new Date(this.selectedSlot.endTime),
      comment: ''
    };

    this.reservationService.createReservation(request).subscribe({
      next: (reservation: any) => { // Explicitly type 'reservation'
        this.toastr.success('Reservation created. You can proceed to payment or wait for approval.', 'Reservation Pending');
        this.isSubmitting = false;
        // Keep modal open and show actions
      },
      error: (err: any) => { // Explicitly type 'err'
        console.error('Failed to create reservation', err);
        this.toastr.error(err?.error?.message || 'Failed to create reservation', 'Error');
        this.isSubmitting = false;
      }
    });
  }

  startPayment(provider: 'paypal' | 'cmi' | 'onsite'): void {
    if (!this.vehicle || !this.selectedSlot) return;
    // We need reservationId; in a full flow we’d fetch payment for latest reservation.
    // For now, we’ll navigate users to reservations page after creation, or this method would be triggered with reservation context.
  }

  getStarRating(rating: number): string[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating ? '★' : '☆');
    }
    return stars;
  }
}
