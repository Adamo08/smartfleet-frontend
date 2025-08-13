import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-vehicle-table',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vehicle-table.html',
  styleUrl: './vehicle-table.css'
})
export class VehicleTable {

}
