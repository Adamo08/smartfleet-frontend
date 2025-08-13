import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './loading-spinner.html',
  styleUrl: './loading-spinner.css'
})
export class LoadingSpinner {

}
