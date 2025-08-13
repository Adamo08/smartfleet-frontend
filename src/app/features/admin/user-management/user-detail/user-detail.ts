import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-detail.html',
  styleUrl: './user-detail.css'
})
export class UserDetail {

}
