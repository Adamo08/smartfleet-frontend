export interface Slot {
  id: number;
  vehicleId: number;
  startTime: Date;
  endTime: Date;
  available: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SlotDto {
  id: number;
  vehicleId: number;
  startTime: Date;
  endTime: Date;
  available: boolean;
  slotType?: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'CUSTOM';
  price?: number;
  createdAt: Date;
  updatedAt: Date;
  vehicleBrand?: string;
  vehicleModel?: string;
}

export interface CreateSlotRequest {
  vehicleId: number;
  startTime: Date;
  endTime: Date;
}

export interface SlotFilter {
  vehicleId?: number;
  isAvailable?: boolean;
  startDate?: Date;
  endDate?: Date;
}
