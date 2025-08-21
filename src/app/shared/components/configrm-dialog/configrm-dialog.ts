import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export enum DialogActionType {
  DELETE = 'delete',
  SUCCESS = 'success',
  WARNING = 'warning',
  INFO = 'info',
  NONE = 'none'
}

@Component({
  selector: 'app-configrm-dialog',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './configrm-dialog.html',
  styleUrl: './configrm-dialog.css'
})
export class ConfigrmDialog {
  @Input() title: string = 'Confirm Action';
  @Input() message: string = 'Are you sure you want to proceed?';
  @Input() confirmButtonText: string = 'Confirm';
  @Input() cancelButtonText: string = 'Cancel';
  @Input() actionType: DialogActionType = DialogActionType.NONE;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  get headerClass(): string {
    switch (this.actionType) {
      case DialogActionType.DELETE:
        return 'from-red-600/10 to-pink-600/10';
      case DialogActionType.SUCCESS:
        return 'from-green-600/10 to-emerald-600/10';
      case DialogActionType.WARNING:
        return 'from-yellow-600/10 to-orange-600/10';
      case DialogActionType.INFO:
        return 'from-blue-600/10 to-cyan-600/10';
      default:
        return 'from-indigo-600/10 to-cyan-600/10';
    }
  }
}
