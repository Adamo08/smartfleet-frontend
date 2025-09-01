import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface SuccessModalConfig {
  title?: string;
  message: string;
  details?: string;
  primaryActionText?: string;
  secondaryActionText?: string;
  showSecondaryAction?: boolean;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SuccessModalService {
  private isOpenSubject = new BehaviorSubject<boolean>(false);
  private configSubject = new BehaviorSubject<SuccessModalConfig | null>(null);

  public isOpen$ = this.isOpenSubject.asObservable();
  public config$ = this.configSubject.asObservable();

  show(config: SuccessModalConfig): void {
    this.configSubject.next(config);
    this.isOpenSubject.next(true);

    // Auto close if specified
    if (config.autoClose) {
      const delay = config.autoCloseDelay || 3000;
      setTimeout(() => {
        this.close();
      }, delay);
    }
  }

  close(): void {
    this.isOpenSubject.next(false);
    // Clear config after animation completes
    setTimeout(() => {
      this.configSubject.next(null);
    }, 300);
  }

  // Convenience methods for common success scenarios
  showEntityCreated(entityName: string, details?: string): void {
    this.show({
      title: `${entityName} Created!`,
      message: `${entityName} has been successfully created.`,
      details,
      autoClose: true,
      autoCloseDelay: 2500
    });
  }

  showEntityUpdated(entityName: string, details?: string): void {
    this.show({
      title: `${entityName} Updated!`,
      message: `${entityName} has been successfully updated.`,
      details,
      autoClose: true,
      autoCloseDelay: 2500
    });
  }

  showEntityDeleted(entityName: string, details?: string): void {
    this.show({
      title: `${entityName} Deleted!`,
      message: `${entityName} has been successfully deleted.`,
      details,
      autoClose: true,
      autoCloseDelay: 2500
    });
  }

  showOperationSuccess(operation: string, details?: string): void {
    this.show({
      title: 'Operation Successful!',
      message: `${operation} completed successfully.`,
      details,
      autoClose: true,
      autoCloseDelay: 2500
    });
  }
}
