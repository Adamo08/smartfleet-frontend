import { PaymentStatus } from '../enums/payment-status.enum';
import { RefundStatus } from '../enums/refund-status.enum';

export interface Payment {
  id: number;
  reservationId: number;
  amount: number;
  currency: string;
  status: PaymentStatus;
  transactionId?: string;
  captureId?: string;
  provider: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentDto {
  id: number;
  reservationId: number;
  amount: number;
  currency: string;
  status: PaymentStatus;
  transactionId?: string;
  captureId?: string;
  provider: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentRequestDto {
  reservationId: number;
  amount: number;
  currency: string;
  paymentMethodId: string;
  providerName: string;
}

export interface PaymentResponseDto {
  paymentId: number;
  transactionId?: string;
  status: string;
  approvalUrl?: string;
}

export interface PaymentDetailsDto {
  id: number;
  amount: number;
  refundedAmount?: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  transactionId?: string;
  captureId?: string;
  createdAt: Date;
  updatedAt: Date;
  reservationId: number;
  userId: number;
  userEmail: string;
}

export interface SessionRequestDto {
  amount: number;
  currency: string;
  reservationId: number;
  successUrl: string;
  cancelUrl: string;
  providerName: string;
}

export interface SessionResponseDto {
  sessionId: string;
  redirectUrl: string; // kept for backward compatibility
}

export enum RefundReason {
  VEHICLE_UNAVAILABLE = 'VEHICLE_UNAVAILABLE',
  CANCELLATION_BY_CUSTOMER = 'CANCELLATION_BY_CUSTOMER',
  TECHNICAL_ISSUE = 'TECHNICAL_ISSUE',
  DUPLICATE_PAYMENT = 'DUPLICATE_PAYMENT',
  WRONG_AMOUNT = 'WRONG_AMOUNT',
  SERVICE_NOT_PROVIDED = 'SERVICE_NOT_PROVIDED',
  EMERGENCY_CANCELLATION = 'EMERGENCY_CANCELLATION',
  WEATHER_CONDITIONS = 'WEATHER_CONDITIONS',
  VEHICLE_DAMAGE = 'VEHICLE_DAMAGE',
  OTHER = 'OTHER'
}

export enum RefundMethod {
  ORIGINAL_PAYMENT_METHOD = 'ORIGINAL_PAYMENT_METHOD',
  PAYPAL = 'PAYPAL',
  ONSITE_CASH = 'ONSITE_CASH'
}

export interface RefundRequestDto {
  paymentId: number;
  amount: number;
  reason: RefundReason;
  refundMethod: RefundMethod;
  additionalNotes?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface RefundResponseDto {
  id: number;
  status: RefundStatus;
  amount: number;
}

export interface RefundDetailsDto {
  id: number;
  paymentId: number;
  refundTransactionId?: string;
  amount: number;
  currency: string;
  reason: string;
  refundMethod?: string;
  additionalNotes?: string;
  contactEmail?: string;
  contactPhone?: string;
  status: RefundStatus;
  requestedAt: Date;
  processedAt?: Date;
  reservationId?: number;
  userId?: number;
  userEmail?: string;
}
