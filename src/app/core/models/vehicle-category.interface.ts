export interface VehicleCategory {
  id: number;
  name: string;
  description?: string;
  iconUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleCategoryDto {
  name: string;
  description?: string;
  iconUrl?: string;
}

export interface UpdateVehicleCategoryDto {
  name?: string;
  description?: string;
  iconUrl?: string;
  isActive?: boolean;
}
