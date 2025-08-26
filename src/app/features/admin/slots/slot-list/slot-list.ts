import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SlotService } from '../../../../core/services/slot.service';
import { Page } from '../../../../core/models/pagination.interface';
import { CreateSlotRequest, SlotDto } from '../../../../core/models/slot.interface'; // Import CreateSlotRequest
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { CeilPipe } from '../../../../shared/pipes/ceil.pipe';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { VehicleService } from '../../../../core/services/vehicle'; // Remove .ts extension
import { Vehicle } from '../../../../core/models/vehicle.interface'; // Import Vehicle interface

@Component({
  selector: 'app-slot-list',
  standalone: true,
  imports: [CommonModule, Pagination, CeilPipe, FormsModule], // Add FormsModule
  templateUrl: './slot-list.html',
  styleUrl: './slot-list.css'
})
export class SlotList implements OnInit {
  slots: SlotDto[] = [];
  page = 0;
  size = 10;
  totalElements = 0;
  isLoading = false;

  isCreateSlotFormOpen: boolean = false;
  newSlot: CreateSlotRequest = {
    vehicleId: 0,
    startTime: new Date(),
    endTime: new Date()
  };
  vehicles: Vehicle[] = []; // To store vehicles for the dropdown

  // Filter properties
  selectedFilterVehicleId: number | null = null;
  filterStartDate: Date | null = null;
  filterEndDate: Date | null = null;
  filterIsAvailable: boolean | null = null;

  constructor(private slotService: SlotService, private vehicleService: VehicleService) {}

  ngOnInit(): void {
    this.load();
    this.loadVehicles(); // Load vehicles when component initializes
  }

  load(page: number = this.page): void {
    this.isLoading = true;
    this.slotService.getAllSlots(
      page,
      this.size,
      this.filterIsAvailable !== null ? this.filterIsAvailable : undefined,
      undefined, // sortBy, use default
      undefined, // sortDirection, use default
      this.selectedFilterVehicleId || undefined,
      this.filterStartDate || undefined,
      this.filterEndDate || undefined
    ).subscribe({
      next: (res: Page<SlotDto>) => {
        this.slots = res.content;
        this.totalElements = res.totalElements;
        this.page = res.number;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  loadVehicles(): void {
    // Assuming getVehicles can fetch all vehicles without pagination or filters for this purpose
    // You might need to adjust VehicleService.getVehicles to have an overload for this scenario
    this.vehicleService.getVehicles({ page: 0, size: 9999 }, {}).subscribe({
      next: (res: Page<Vehicle>) => {
        this.vehicles = res.content;
      },
      error: (error) => {
        console.error('Error loading vehicles:', error);
      }
    });
  }

  openCreateSlotForm(): void {
    this.isCreateSlotFormOpen = true;
    // Reset newSlot for a fresh form
    this.newSlot = { vehicleId: 0, startTime: new Date(), endTime: new Date() };
  }

  closeCreateSlotForm(): void {
    this.isCreateSlotFormOpen = false;
  }

  applyFilters(): void {
    this.page = 0; // Reset to first page when applying filters
    this.load();
  }

  clearFilters(): void {
    this.selectedFilterVehicleId = null;
    this.filterStartDate = null;
    this.filterEndDate = null;
    this.filterIsAvailable = null;
    this.page = 0; // Reset to first page
    this.load();
  }

  submitCreateSlot(): void {
    // Basic validation, more robust validation can be added
    if (this.newSlot.vehicleId === 0 || !this.newSlot.startTime || !this.newSlot.endTime) {
      alert('Please fill all required fields.');
      return;
    }

    this.slotService.createSlot(this.newSlot).subscribe({
      next: (createdSlot) => {
        console.log('Slot created:', createdSlot);
        this.closeCreateSlotForm();
        this.load(); // Reload slots to show the new one
      },
      error: (error) => {
        console.error('Error creating slot:', error);
        alert('Failed to create slot: ' + (error.error.message || 'Unknown error'));
      }
    });
  }
}
