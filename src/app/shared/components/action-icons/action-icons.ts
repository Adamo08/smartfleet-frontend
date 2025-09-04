import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ActionConfig {
  view?: boolean;
  edit?: boolean;
  delete?: boolean;
  toggle?: boolean;
  custom?: CustomAction[];
}

export interface CustomAction {
  icon: string;
  label: string;
  onClick: () => void;
  classes?: string;
  tooltip?: string;
}

@Component({
  selector: 'app-action-icons',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex space-x-2">
      <!-- View Action -->
      @if (actions.view) {
        <button 
          (click)="onView.emit()"
          class="text-blue-600 hover:text-blue-700 transition-colors duration-200 p-2 rounded-lg hover:bg-blue-50 border border-blue-200 hover:border-blue-300"
          title="View Details">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
        </button>
      }

      <!-- Edit Action -->
      @if (actions.edit) {
        <button 
          (click)="onEdit.emit()"
          class="text-amber-600 hover:text-amber-700 transition-colors duration-200 p-2 rounded-lg hover:bg-amber-50 border border-amber-200 hover:border-amber-300"
          title="Edit">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
        </button>
      }

      <!-- Delete Action -->
      @if (actions.delete) {
        <button 
          (click)="onDelete.emit()"
          class="text-red-600 hover:text-red-700 transition-colors duration-200 p-2 rounded-lg hover:bg-red-50 border border-red-200 hover:border-red-300"
          title="Delete">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      }

      <!-- Toggle Action -->
      @if (actions.toggle) {
        <button 
          (click)="onToggle.emit()"
          [class]="toggleClasses"
          [title]="toggleTitle">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </button>
      }

      <!-- Custom Actions -->
      @if (actions.custom) {
        @for (action of actions.custom; track action.label) {
          <button 
            (click)="action.onClick()"
            [class]="'transition-colors duration-200 p-2 rounded-lg border ' + (action.classes || 'text-gray-600 hover:text-gray-700 hover:bg-gray-50 border-gray-200 hover:border-gray-300')"
            [title]="action.tooltip || action.label">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="action.icon"/>
            </svg>
          </button>
        }
      }
    </div>
  `
})
export class ActionIcons {
  @Input() actions: ActionConfig = {};
  @Input() isActive: boolean = true;
  @Input() toggleTitle: string = 'Toggle Status';
  
  @Output() onView = new EventEmitter<void>();
  @Output() onEdit = new EventEmitter<void>();
  @Output() onDelete = new EventEmitter<void>();
  @Output() onToggle = new EventEmitter<void>();

  get toggleClasses(): string {
    const baseClasses = 'transition-colors duration-200 p-2 rounded-lg border';
    if (this.isActive) {
      return `${baseClasses} text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300`;
    } else {
      return `${baseClasses} text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 hover:border-green-300`;
    }
  }
}
