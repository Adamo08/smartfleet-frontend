import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { PaymentMethod, PaymentResult } from './payment-processing.service';

export interface PaymentState {
  selectedMethod: PaymentMethod | null;
  isProcessing: boolean;
  errorMessage: string | null;
  currentReservationId: number | null;
  paymentAmount: number | null;
  paymentCurrency: string;
  lastPaymentResult: PaymentResult | null;
}

export interface PaymentActions {
  selectMethod: (method: PaymentMethod) => void;
  setProcessing: (isProcessing: boolean) => void;
  setError: (error: string | null) => void;
  setReservation: (reservationId: number | null) => void;
  setAmount: (amount: number | null) => void;
  setCurrency: (currency: string) => void;
  setPaymentResult: (result: PaymentResult | null) => void;
  reset: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentStateService {
  private readonly initialState: PaymentState = {
    selectedMethod: null,
    isProcessing: false,
    errorMessage: null,
    currentReservationId: null,
    paymentAmount: null,
    paymentCurrency: 'USD',
    lastPaymentResult: null
  };

  private readonly stateSubject = new BehaviorSubject<PaymentState>(this.initialState);
  private readonly state$ = this.stateSubject.asObservable();

  // Public observables for components to subscribe to
  readonly selectedMethod$ = this.state$.pipe(
    map(state => state.selectedMethod),
    distinctUntilChanged()
  );

  readonly isProcessing$ = this.state$.pipe(
    map(state => state.isProcessing),
    distinctUntilChanged()
  );

  readonly errorMessage$ = this.state$.pipe(
    map(state => state.errorMessage),
    distinctUntilChanged()
  );

  readonly currentReservationId$ = this.state$.pipe(
    map(state => state.currentReservationId),
    distinctUntilChanged()
  );

  readonly paymentAmount$ = this.state$.pipe(
    map(state => state.paymentAmount),
    distinctUntilChanged()
  );

  readonly paymentCurrency$ = this.state$.pipe(
    map(state => state.paymentCurrency),
    distinctUntilChanged()
  );

  readonly lastPaymentResult$ = this.state$.pipe(
    map(state => state.lastPaymentResult),
    distinctUntilChanged()
  );

  // Computed observables
  readonly canProceedWithPayment$ = combineLatest([
    this.selectedMethod$,
    this.currentReservationId$,
    this.paymentAmount$,
    this.isProcessing$
  ]).pipe(
    map(([method, reservationId, amount, isProcessing]) => 
      !!method && !!reservationId && !!amount && !isProcessing
    )
  );

  readonly hasError$ = this.errorMessage$.pipe(
    map(error => !!error)
  );

  // Actions
  readonly actions: PaymentActions = {
    selectMethod: (method: PaymentMethod) => this.updateState({ selectedMethod: method }),
    setProcessing: (isProcessing: boolean) => this.updateState({ isProcessing }),
    setError: (error: string | null) => this.updateState({ errorMessage: error }),
    setReservation: (reservationId: number | null) => this.updateState({ currentReservationId: reservationId }),
    setAmount: (amount: number | null) => this.updateState({ paymentAmount: amount }),
    setCurrency: (currency: string) => this.updateState({ paymentCurrency: currency }),
    setPaymentResult: (result: PaymentResult | null) => this.updateState({ lastPaymentResult: result }),
    reset: () => this.resetState()
  };

  // Getters for current state
  get currentState(): PaymentState {
    return this.stateSubject.value;
  }

  get selectedMethod(): PaymentMethod | null {
    return this.currentState.selectedMethod;
  }

  get isProcessing(): boolean {
    return this.currentState.isProcessing;
  }

  get errorMessage(): string | null {
    return this.currentState.errorMessage;
  }

  get currentReservationId(): number | null {
    return this.currentState.currentReservationId;
  }

  get paymentAmount(): number | null {
    return this.currentState.paymentAmount;
  }

  get paymentCurrency(): string {
    return this.currentState.paymentCurrency;
  }

  get lastPaymentResult(): PaymentResult | null {
    return this.currentState.lastPaymentResult;
  }

  // Public methods for components
  selectPaymentMethod(method: PaymentMethod): void {
    this.actions.selectMethod(method);
    this.actions.setError(null); // Clear any previous errors
  }

  startPaymentProcessing(): void {
    this.actions.setProcessing(true);
    this.actions.setError(null);
  }

  stopPaymentProcessing(): void {
    this.actions.setProcessing(false);
  }

  setPaymentError(error: string): void {
    this.actions.setError(error);
    this.actions.setProcessing(false);
  }

  clearPaymentError(): void {
    this.actions.setError(null);
  }

  setReservationForPayment(reservationId: number, amount: number, currency: string = 'USD'): void {
    this.actions.setReservation(reservationId);
    this.actions.setAmount(amount);
    this.actions.setCurrency(currency);
  }

  setPaymentResult(result: PaymentResult): void {
    this.actions.setPaymentResult(result);
    if (result.success) {
      this.actions.setError(null);
    } else {
      this.actions.setError(result.error || 'Payment failed');
    }
    this.actions.setProcessing(false);
  }

  resetPaymentState(): void {
    this.resetState();
  }

  // Private methods
  private updateState(partialState: Partial<PaymentState>): void {
    const currentState = this.stateSubject.value;
    const newState = { ...currentState, ...partialState };
    this.stateSubject.next(newState);
  }

  private resetState(): void {
    this.stateSubject.next(this.initialState);
  }

  // Utility methods
  isMethodSelected(methodId: string): boolean {
    return this.selectedMethod?.id === methodId;
  }

  hasValidPaymentData(): boolean {
    return !!(
      this.selectedMethod &&
      this.currentReservationId &&
      this.paymentAmount &&
      !this.isProcessing
    );
  }

  getPaymentSummary(): { method: string; amount: number; currency: string } | null {
    if (!this.hasValidPaymentData()) {
      return null;
    }

    return {
      method: this.selectedMethod!.name,
      amount: this.paymentAmount!,
      currency: this.paymentCurrency
    };
  }
}

