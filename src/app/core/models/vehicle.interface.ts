export interface Vehicle {
  id: number;
  categoryId: number;
  categoryName: string;
  brandId: number;
  brandName: string;
  modelId: number;
  modelName: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  fuelType: FuelType;
  status: VehicleStatus;
  mileage: number;
  pricePerDay: number;
  imageUrl?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleSummaryDto {
  id: number;
  brand: string;
  model: string;
  licensePlate: string;
  year?: number;
  imageUrl?: string;
  pricePerDay: number;
}

export enum FuelType {
  GASOLINE = 'GASOLINE',
  DIESEL = 'DIESEL',
  ELECTRIC = 'ELECTRIC',
  HYBRID = 'HYBRID'
}

export enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  RENTED = 'RENTED',
  MAINTENANCE = 'MAINTENANCE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE'
}
