import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-vehicle-form',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vehicle-form.html',
  styleUrl: './vehicle-form.css'
})
export class VehicleForm {

}
