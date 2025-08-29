import { ReservationStatus } from '../enums/reservation-status.enum';
import { SlotDto } from './slot.interface';
import { Vehicle, VehicleSummaryDto } from './vehicle.interface';
import { User } from './user.interface';

export interface Reservation {
  id: number;
  userId: number;
  vehicleId: number;
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
  slots: SlotDto[];
  startDate: Date;
  endDate: Date;
  comment?: string;
  status: ReservationStatus;
  createdAt: Date;
  bookingContext?: ReservationBookingContext;
}

export interface ReservationSummaryDto {
  id: number;
  user: UserSummaryDto;
  vehicle: VehicleSummaryDto;
  startDate: Date;
  endDate: Date;
  status: ReservationStatus;
  createdAt: Date;
  bookingContext?: ReservationBookingContext;
}

export interface CreateReservationRequest {
  vehicleId: number;
  startDate: Date;
  endDate: Date;
  comment?: string;
  bookingContext?: ReservationBookingContext;
}

export interface ReservationBookingContext {
  slotType: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'CUSTOM';
  duration: number; // in hours
  calculationMethod: 'SLOT_BASED' | 'DATE_RANGE' | 'DURATION_BASED';
  selectedSlotIds?: number[];
  originalAmount?: number;
  preferences?: {
    preferredPaymentMethod?: string;
    specialRequests?: string;
  };
}

export interface ReservationFilter {
  userId?: number;
  vehicleId?: number;
  status?: ReservationStatus;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
}

export interface AdminReservationUpdateRequest {
  status: ReservationStatus;
  comment?: string;
  adminNotes?: string;
}

// Additional interfaces for enriched data
export interface UserSummaryDto {
  id: number;
  firstName: string;
  lastName: string;
}