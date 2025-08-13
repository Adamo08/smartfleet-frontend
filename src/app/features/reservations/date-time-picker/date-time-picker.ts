import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-date-time-picker',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './date-time-picker.html',
  styleUrl: './date-time-picker.css'
})
export class DateTimePicker {

}
