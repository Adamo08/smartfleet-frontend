export interface VehicleFilter {
  search?: string;
  brandId?: number;
  modelId?: number;
  categoryId?: number;
  fuelType?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  minMileage?: number;
  maxMileage?: number;
}
