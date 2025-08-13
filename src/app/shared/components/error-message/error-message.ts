import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './error-message.html',
  styleUrl: './error-message.css'
})
export class ErrorMessage {

}
