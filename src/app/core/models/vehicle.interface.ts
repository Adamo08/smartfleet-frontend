export interface Vehicle {
  id: number;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  vehicleType: VehicleType;
  fuelType: FuelType;
  status: VehicleStatus;
  mileage: number;
  pricePerDay: number;
  imageUrl?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export enum VehicleType {
  SEDAN = 'SEDAN',
  SUV = 'SUV',
  TRUCK = 'TRUCK',
  VAN = 'VAN',
  MOTORCYCLE = 'MOTORCYCLE'
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
