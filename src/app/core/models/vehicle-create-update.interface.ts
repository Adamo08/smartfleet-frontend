import { FuelType, VehicleStatus } from './vehicle.interface';

export interface CreateVehicleDto {
  categoryId: number;
  brandId: number;
  modelId: number;
  year: number;
  licensePlate: string;
  fuelType: FuelType;
  status: VehicleStatus;
  mileage: number;
  pricePerDay: number;
  imageUrl?: string;
  description?: string;
}

export interface UpdateVehicleDto {
  categoryId?: number;
  brandId?: number;
  modelId?: number;
  year?: number;
  licensePlate?: string;
  fuelType?: FuelType;
  status?: VehicleStatus;
  mileage?: number;
  pricePerDay?: number;
  imageUrl?: string;
  description?: string;
}

export interface CreateVehicleBrandDto {
  name: string;
  description?: string;
  logoUrl?: string;
  countryOfOrigin?: string;
}

export interface UpdateVehicleBrandDto {
  name?: string;
  description?: string;
  logoUrl?: string;
  countryOfOrigin?: string;
  isActive?: boolean;
}

export interface CreateVehicleModelDto {
  name: string;
  brandId: number;
  description?: string;
}

export interface UpdateVehicleModelDto {
  name?: string;
  brandId?: number;
  description?: string;
  isActive?: boolean;
}
