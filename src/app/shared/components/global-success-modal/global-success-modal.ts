import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SuccessModal } from '../success-modal/success-modal';
import { SuccessModalService, SuccessModalConfig } from '../../services/success-modal.service';

@Component({
  selector: 'app-global-success-modal',
  standalone: true,
  imports: [CommonModule, SuccessModal],
  template: `
    <app-success-modal
      [isOpen]="isOpen"
      [title]="config?.title || ''"
      [message]="config?.message || ''"
      [details]="config?.details || ''"
      [primaryActionText]="config?.primaryActionText || 'OK'"
      [secondaryActionText]="config?.secondaryActionText || ''"
      [showSecondaryAction]="config?.showSecondaryAction || false"
      (close)="onClose()"
      (primaryAction)="onPrimaryAction()"
      (secondaryAction)="onSecondaryAction()"
    ></app-success-modal>
  `
})
export class GlobalSuccessModal implements OnInit, OnDestroy {
  isOpen = false;
  config: SuccessModalConfig | null = null;
  private subscriptions: Subscription[] = [];

  constructor(private successModalService: SuccessModalService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.successModalService.isOpen$.subscribe(isOpen => {
        this.isOpen = isOpen;
      }),
      this.successModalService.config$.subscribe(config => {
        this.config = config;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onClose(): void {
    this.successModalService.close();
  }

  onPrimaryAction(): void {
    // Handle primary action if needed
    this.successModalService.close();
  }

  onSecondaryAction(): void {
    // Handle secondary action if needed
  }
}
