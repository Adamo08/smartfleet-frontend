export interface Vehicle {
  id: number;
  categoryId: number;
  categoryName: string;
  brandId: number;
  brandName: string;
  modelId: number;
  modelName: string;
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

  // Backward compatibility properties
  brand: string;  // should be set to brandName
  model: string;  // should be set to modelName
}

export interface VehicleSummaryDto {
  id: number;
  brandName: string;
  modelName: string;
  licensePlate: string;
  year?: number;
  imageUrl?: string;
  pricePerDay: number;

  // Backward compatibility properties
  brand: string;  // should be set to brandName
  model: string;  // should be set to modelName
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
  IN_MAINTENANCE = 'IN_MAINTENANCE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE'
}
