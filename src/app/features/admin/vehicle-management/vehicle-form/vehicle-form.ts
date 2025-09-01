import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Vehicle } from '../../../../core/models/vehicle.interface';
import { VehicleService } from '../../../../core/services/vehicle';
import { ApiService } from '../../../../core/services/api';
import { SuccessModalService } from '../../../../shared/services/success-modal.service';

@Component({
  selector: 'app-vehicle-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './vehicle-form.html',
  styleUrl: './vehicle-form.css'
})
export class VehicleForm implements OnInit {
  @Input() vehicle: Vehicle | null = null
  @Output() formSubmitted = new EventEmitter<void>();

  form: FormGroup;
  editMode = false;
  categories: any[] = [];
  brands: any[] = [];
  models: any[] = [];
  fuelTypes: any[] = [];
  vehicleStatuses: any[] = [];

  constructor(
    private fb: FormBuilder,
    private vehicleService: VehicleService,
    private api: ApiService,
    private successModalService: SuccessModalService
  ) {
    this.form = this.fb.group({
      licensePlate: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]{6,8}$/)]],
      brandId: ['', Validators.required],
      modelId: ['', Validators.required],
      categoryId: ['', Validators.required],
      year: ['', [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear() + 1)]],
      fuelType: ['', Validators.required],
      mileage: ['', [Validators.required, Validators.min(0)]],
      pricePerDay: ['', [Validators.required, Validators.min(0)]],
      status: ['AVAILABLE', Validators.required],
      imageUrl: [''],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadBrands();
    this.loadFuelTypes();
    this.loadVehicleStatuses();
    
    if (this.vehicle) {
      this.editMode = true;
      this.form.patchValue(this.vehicle);
      this.loadModels(this.vehicle.brandId);
    }
  }

  loadCategories(): void {
    this.vehicleService.getAllVehicleCategories().subscribe({
      next: (response) => this.categories = response.content,
      error: (err) => console.error('Error loading categories', err)
    });
  }

  loadBrands(): void {
    this.vehicleService.getAllVehicleBrands().subscribe({
      next: (response) => this.brands = response.content,
      error: (err) => console.error('Error loading brands', err)
    });
  }

  loadModels(brandId?: number): void {
    if (brandId) {
      this.vehicleService.getVehicleModelsByBrand(brandId).subscribe({
        next: (response) => this.models = response.content,
        error: (err) => console.error('Error loading models', err)
      });
    }
  }

  loadFuelTypes(): void {
    this.vehicleService.getFuelTypes().subscribe({
      next: (response) => this.fuelTypes = response,
      error: (err) => console.error('Error loading fuel types', err)
    });
  }

  loadVehicleStatuses(): void {
    this.vehicleService.getVehicleStatuses().subscribe({
      next: (response) => this.vehicleStatuses = response,
      error: (err) => console.error('Error loading vehicle statuses', err)
    });
  }

  submit(): void {
    if (this.form.invalid) return;

    const vehicleData = { ...this.form.value };

    if (this.editMode) {
      this.api.put(`/admin/vehicles/${this.vehicle!.id}`, vehicleData).subscribe({
        next: () => {
          this.successModalService.showEntityUpdated('Vehicle', `Vehicle ${vehicleData.licensePlate} has been successfully updated`);
          this.formSubmitted.emit();
        },
        error: (err) => console.error('Error updating vehicle:', err)
      });
    } else {
      this.api.post('/admin/vehicles', vehicleData).subscribe({
        next: () => {
          this.successModalService.showEntityCreated('Vehicle', `Vehicle ${vehicleData.licensePlate} has been successfully created`);
          this.formSubmitted.emit();
          this.resetForm();
        },
        error: (err) => console.error('Error creating vehicle:', err)
      });
    }
  }

  resetForm(): void {
    this.form.reset();
    this.editMode = false;
  }
}
