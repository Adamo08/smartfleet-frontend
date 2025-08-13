import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-vehicle-gallery',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vehicle-gallery.html',
  styleUrl: './vehicle-gallery.css'
})
export class VehicleGallery {

}
