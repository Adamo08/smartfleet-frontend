import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ApiService } from '../../../../core/services/api';
import { FuelType, Vehicle, VehicleStatus, VehicleType } from '../../../../core/models/vehicle.interface';

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
  vehicleTypes = Object.values(VehicleType);
  fuelTypes = Object.values(FuelType);
  vehicleStatuses = Object.values(VehicleStatus);

  constructor(private fb: FormBuilder, private api: ApiService) {}

  ngOnInit(): void {
    this.editMode = !!this.vehicle;
    this.form = this.fb.group({
      brand: [this.vehicle ? this.vehicle.brand : '', Validators.required],
      model: [this.vehicle ? this.vehicle.model : '', Validators.required],
      year: [this.vehicle ? this.vehicle.year : '', [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear() + 1)]],
      licensePlate: [this.vehicle ? this.vehicle.licensePlate : '', Validators.required],
      vehicleType: [this.vehicle ? this.vehicle.vehicleType : '', Validators.required],
      fuelType: [this.vehicle ? this.vehicle.fuelType : '', Validators.required],
      status: [this.vehicle ? this.vehicle.status : '', Validators.required],
      mileage: [this.vehicle ? this.vehicle.mileage : '', [Validators.required, Validators.min(0)]],
      pricePerDay: [this.vehicle ? this.vehicle.pricePerDay : '', [Validators.required, Validators.min(0)]],
      imageUrl: [this.vehicle ? this.vehicle.imageUrl : ''],
      description: [this.vehicle ? this.vehicle.description : '']
    });
  }

  submit(): void {
    if (this.form.invalid) return;

    if (this.editMode) {
      this.api.put(`/vehicles/${this.vehicle!.id}`, this.form.value).subscribe({
        next: () => this.formSubmitted.emit(),
        error: (err) => console.error('Error updating vehicle:', err)
      });
    } else {
      this.api.post('/vehicles', this.form.value).subscribe({
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
