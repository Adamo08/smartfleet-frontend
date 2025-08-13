import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './toast.html',
  styleUrl: './toast.css'
})
export class Toast {

}
