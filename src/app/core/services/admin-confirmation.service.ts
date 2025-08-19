import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface AdminConfirmationDialog {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
  requireReason?: boolean;
}

export interface AdminConfirmationResult {
  confirmed: boolean;
  reason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminConfirmationService {
  private confirmationSubject = new Subject<AdminConfirmationDialog>();
  private resultSubject = new Subject<AdminConfirmationResult>();

  /**
   * Show a confirmation dialog for admin actions
   */
  confirm(dialog: AdminConfirmationDialog): Observable<AdminConfirmationResult> {
    this.confirmationSubject.next(dialog);
    return this.resultSubject.asObservable();
  }

  /**
   * Get the confirmation dialog stream
   */
  getConfirmationStream(): Observable<AdminConfirmationDialog> {
    return this.confirmationSubject.asObservable();
  }

  /**
   * Send the result back to the confirmation requester
   */
  sendResult(result: AdminConfirmationResult): void {
    this.resultSubject.next(result);
  }

  /**
   * Convenience method for dangerous actions
   */
  confirmDangerousAction(
    action: string,
    resource: string,
    resourceId?: number
  ): Observable<AdminConfirmationResult> {
    const resourceText = resourceId ? `${resource} #${resourceId}` : resource;
    
    return this.confirm({
      title: 'Confirm Dangerous Action',
      message: `Are you sure you want to ${action} ${resourceText}? This action cannot be undone and may affect system data.`,
      confirmText: 'Yes, proceed',
      cancelText: 'Cancel',
      type: 'danger',
      requireReason: true
    });
  }

  /**
   * Convenience method for status updates
   */
  confirmStatusUpdate(
    resource: string,
    resourceId: number,
    oldStatus: string,
    newStatus: string
  ): Observable<AdminConfirmationResult> {
    return this.confirm({
      title: 'Confirm Status Update',
      message: `Are you sure you want to change the status of ${resource} #${resourceId} from "${oldStatus}" to "${newStatus}"?`,
      confirmText: 'Update Status',
      cancelText: 'Cancel',
      type: 'warning',
      requireReason: false
    });
  }

  /**
   * Convenience method for bulk actions
   */
  confirmBulkAction(
    action: string,
    resource: string,
    count: number
  ): Observable<AdminConfirmationResult> {
    return this.confirm({
      title: 'Confirm Bulk Action',
      message: `Are you sure you want to ${action} ${count} ${resource}${count > 1 ? 's' : ''}? This action will be applied to all selected items.`,
      confirmText: 'Yes, proceed',
      cancelText: 'Cancel',
      type: 'warning',
      requireReason: true
    });
  }
}
