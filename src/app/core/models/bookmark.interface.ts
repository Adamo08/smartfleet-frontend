import { ReservationStatus } from '../enums/reservation-status.enum';

export interface Bookmark {
  id: number;
  userId: number;
  reservationId: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookmarkDto {
  id: number;
  userId: number;
  reservationId: number;
  createdAt: string;
  updatedAt: string;
  
  // Enriched fields for displaying bookmarks without extra lookups
  userName: string;
  userEmail: string;
  
  // Reservation details
  reservationStartDate: string;
  reservationEndDate: string;
  reservationStatus: ReservationStatus;
  
  // Vehicle details from the associated reservation
  vehicleId: number;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleImageUrl?: string;
}

export interface CreateBookmarkRequest {
  reservationId: number;
}

export interface BookmarkFilter {
  userId?: number;
  reservationId?: number;
  vehicleId?: number;
  status?: ReservationStatus;
}

export interface BookmarkPageRequest {
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  userId?: number;
}
