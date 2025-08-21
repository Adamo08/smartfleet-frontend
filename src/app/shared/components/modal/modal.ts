import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './modal.html',
  styleUrl: './modal.css'
})
export class Modal {
  @Input() title: string = 'Modal';
  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }
}
