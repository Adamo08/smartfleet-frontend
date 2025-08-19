import { ReservationStatus } from '../enums/reservation-status.enum';
import { SlotDto } from './slot.interface';
import { Vehicle } from './vehicle.interface';
import { User } from './user.interface';

export interface Reservation {
  id: number;
  userId: number;
  vehicleId: number;
  slotId: number;
  startDate: Date;
  endDate: Date;
  comment?: string;
  status: ReservationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReservationDto {
  id: number;
  userId: number;
  vehicleId: number;
  startDate: Date;
  endDate: Date;
  comment?: string;
  status: ReservationStatus;
}

export interface DetailedReservationDto {
  id: number;
  user: User;
  vehicle: Vehicle;
  slot: SlotDto;
  startDate: Date;
  endDate: Date;
  comment?: string;
  status: ReservationStatus;
  createdAt: Date;
}

export interface ReservationSummaryDto {
  id: number;
  vehicle: VehicleSummaryDto;
  startDate: Date;
  endDate: Date;
  status: ReservationStatus;
  createdAt: Date;
}

export interface CreateReservationRequest {
  vehicleId: number;
  slotId: number;
  startDate: Date;
  endDate: Date;
  comment?: string;
}

export interface ReservationFilter {
  userId?: number;
  vehicleId?: number;
  status?: ReservationStatus;
  startDate?: Date;
  endDate?: Date;
}

export interface AdminReservationUpdateRequest {
  status: ReservationStatus;
}

// Additional interfaces for enriched data
export interface VehicleSummaryDto {
  id: number;
  brand: string;
  model: string;
  licensePlate: string;
  year?: number;
  imageUrl?: string;
}