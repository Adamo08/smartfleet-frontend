import { PaymentStatus } from '../enums/payment-status.enum';

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
  reservationId: number;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
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

export interface RefundRequestDto {
  paymentId: number;
  amount: number;
  reason: string;
  refundMethod?: string;
  additionalNotes?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface RefundResponseDto {
  id: number;
  status: string;
  amount: number;
}

export interface RefundDetailsDto {
  id: number;
  paymentId: number;
  amount: number;
  reason: string;
  status: string;
  createdAt: Date;
}
