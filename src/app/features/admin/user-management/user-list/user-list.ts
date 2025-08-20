import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../../core/services/api';
import { User } from '../../../../core/models/user.interface';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css'
})
export class UserList implements OnInit {
  users: User[] = [];
  isLoading = false;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.api.get<User[]>('/users').subscribe({
      next: users => { this.users = users; this.isLoading = false; },
      error: () => this.isLoading = false
    });
  }
}
