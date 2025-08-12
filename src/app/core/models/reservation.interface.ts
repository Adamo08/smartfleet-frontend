export interface Reservation {
  id: number;
  userId: number;
  vehicleId: number;
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  status: ReservationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface CreateReservationRequest {
  vehicleId: number;
  startDate: Date;
  endDate: Date;
}
