import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ApiService } from '../../../../core/services/api';
import { FuelType, Vehicle, VehicleStatus } from '../../../../core/models/vehicle.interface';
import { Page } from '../../../../core/models/pagination.interface';
import { VehicleCategory } from '../../../../core/models/vehicle-category.interface';
import { CreateVehicleDto, UpdateVehicleDto } from '../../../../core/models/vehicle-create-update.interface';

@Component({
  selector: 'app-vehicle-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './vehicle-form.html',
  styleUrl: './vehicle-form.css'
})
export class VehicleForm implements OnInit {
  @Input() vehicle: Vehicle | null = null;
  @Output() formSubmitted = new EventEmitter<void>();

  form!: FormGroup;
  editMode = false;
  categories: VehicleCategory[] = [];
  brands: VehicleBrand[] = [];
  models: VehicleModel[] = [];
  fuelTypes = Object.values(FuelType);
  vehicleStatuses = Object.values(VehicleStatus);

  constructor(private fb: FormBuilder, private api: ApiService) {}

  ngOnInit(): void {
    this.editMode = !!this.vehicle;
    this.loadCategories();
    this.loadBrands();
    this.loadModels();
    this.form = this.fb.group({
      categoryId: [this.vehicle?.categoryId || null, Validators.required],
      brandId: [this.vehicle?.brandId || null, Validators.required],
      modelId: [this.vehicle?.modelId || null, Validators.required],
      year: [this.vehicle ? this.vehicle.year : '', [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear() + 1)]],
      licensePlate: [this.vehicle ? this.vehicle.licensePlate : '', Validators.required],
      fuelType: [this.vehicle ? this.vehicle.fuelType : '', Validators.required],
      status: [this.vehicle ? this.vehicle.status : '', Validators.required],
      mileage: [this.vehicle ? this.vehicle.mileage : '', [Validators.required, Validators.min(0)]],
      pricePerDay: [this.vehicle ? this.vehicle.pricePerDay : '', [Validators.required, Validators.min(0)]],
      imageUrl: [this.vehicle ? this.vehicle.imageUrl : ''],
      description: [this.vehicle ? this.vehicle.description : '']
    });
  }

  loadCategories(): void {
    this.api.get<Page<VehicleCategory>>('/admin/vehicle-categories', { page: 0, size: 9999 }).subscribe({
      next: (page) => this.categories = page.content,
      error: (err) => console.error('Error loading categories', err)
    });
  }

  loadBrands(): void {
    this.api.get<Page<VehicleBrand>>('/admin/vehicle-brands', { page: 0, size: 9999 }).subscribe({
      next: (page) => this.brands = page.content,
      error: (err) => console.error('Error loading brands', err)
    });
  }

  loadModels(): void {
    this.api.get<Page<VehicleModel>>('/admin/vehicle-models', { page: 0, size: 9999 }).subscribe({
      next: (page) => this.models = page.content,
      error: (err) => console.error('Error loading models', err)
    });
  }

  submit(): void {
    if (this.form.invalid) return;

    const vehicleData = { ...this.form.value };

    if (this.editMode) {
      this.api.put(`/admin/vehicles/${this.vehicle!.id}`, vehicleData).subscribe({
        next: () => this.formSubmitted.emit(),
        error: (err) => console.error('Error updating vehicle:', err)
      });
    } else {
      this.api.post('/admin/vehicles', vehicleData).subscribe({
        next: () => {
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

interface VehicleBrand {
  id: number;
  name: string;
}

interface VehicleModel {
  id: number;
  name: string;
}
