import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminConfirmationService, AdminConfirmationDialog, AdminConfirmationResult } from '../../../core/services/admin-confirmation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (showDialog) {
      <div class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <!-- Background overlay -->
          <div class="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
               (click)="cancel()"></div>

          <!-- Modal panel -->
          <div class="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <!-- Header -->
            <div class="px-6 py-4 border-b border-gray-200">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900">
                  {{ currentDialog?.title }}
                </h3>
                <button
                  (click)="cancel()"
                  class="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Body -->
            <div class="px-6 py-4">
              <p class="text-gray-700 mb-4">
                {{ currentDialog?.message }}
              </p>

              @if (currentDialog?.requireReason) {
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Reason for this action (required)
                  </label>
                  <textarea
                    [(ngModel)]="reason"
                    rows="3"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Please provide a reason for this action...">
                  </textarea>
                </div>
              }
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                (click)="cancel()"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                {{ currentDialog?.cancelText || 'Cancel' }}
              </button>
              <button
                (click)="confirm()"
                [disabled]="currentDialog?.requireReason && !reason.trim()"
                class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed">
                {{ currentDialog?.confirmText || 'Confirm' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: []
})
export class AdminConfirmationDialogComponent implements OnInit, OnDestroy {
  showDialog = false;
  currentDialog?: AdminConfirmationDialog;
  reason = '';
  private subscription?: Subscription;

  constructor(private adminConfirmationService: AdminConfirmationService) {}

  ngOnInit(): void {
    this.subscription = this.adminConfirmationService.getConfirmationStream()
      .subscribe(dialog => {
        this.currentDialog = dialog;
        this.showDialog = true;
        this.reason = '';
      });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  confirm(): void {
    if (this.currentDialog?.requireReason && !this.reason?.trim()) {
      return;
    }

    const result: AdminConfirmationResult = {
      confirmed: true,
      reason: this.reason?.trim() || undefined
    };

    this.adminConfirmationService.sendResult(result);
    this.closeDialog();
  }

  cancel(): void {
    const result: AdminConfirmationResult = {
      confirmed: false
    };

    this.adminConfirmationService.sendResult(result);
    this.closeDialog();
  }

  private closeDialog(): void {
    this.showDialog = false;
    this.currentDialog = undefined;
    this.reason = '';
  }
}
