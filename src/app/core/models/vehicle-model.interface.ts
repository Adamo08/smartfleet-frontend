export interface VehicleModel {
  id: number;
  name: string;
  brandId: number;
  brandName: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
