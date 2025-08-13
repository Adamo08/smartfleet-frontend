import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-vehicle-search',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vehicle-search.html',
  styleUrl: './vehicle-search.css'
})
export class VehicleSearch {

}
