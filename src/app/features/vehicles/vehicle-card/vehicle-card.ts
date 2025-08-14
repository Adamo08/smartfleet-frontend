import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Vehicle } from '../../../core/models/vehicle.interface';

@Component({
  selector: 'app-vehicle-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vehicle-card.html',
  styleUrl: './vehicle-card.css'
})
export class VehicleCard {
  @Input() vehicle!: Vehicle;
  @Input() isLoggedIn: boolean = false;
  @Input() isFavorite: boolean = false;
  @Output() favoriteToggled = new EventEmitter<number>();

  toggleFavorite(): void {
    this.favoriteToggled.emit(this.vehicle.id);
  }
}
