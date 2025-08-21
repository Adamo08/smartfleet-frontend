import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { User } from '../../../../core/models/user.interface';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-detail.html',
  styleUrl: './user-detail.css'
})
export class UserDetail {
  @Input() user!: User;
}
