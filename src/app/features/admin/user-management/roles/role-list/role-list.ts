import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ApiService } from '../../../../../core/services/api';
import { User } from '../../../../../core/models/user.interface';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './role-list.html',
  styleUrl: './role-list.css'
})
export class RoleList implements OnInit {
  users: User[] = [];
  isLoading = false;

  constructor(private api: ApiService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.api.get<User[]>('/users').subscribe({
      next: (users) => { this.users = users; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  updateRole(user: User, role: 'ADMIN'|'CUSTOMER'|'GUEST'): void {
    this.api.patch<User>(`/users/${user.id}/role`, { role }).subscribe(res => {
      user.role = res.role as any;
    });
  }
}
