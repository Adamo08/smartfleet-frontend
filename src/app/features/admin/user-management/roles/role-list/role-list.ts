import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormsModule } from '@angular/forms';
import { ApiService } from '../../../../../core/services/api';
import { User } from '../../../../../core/models/user.interface';
import { SkeletonPage } from '../../../../../shared/components/skeleton-page/skeleton-page';
import { SuccessModalService } from '../../../../../shared/services/success-modal.service';
import { Page, Pageable } from '../../../../../core/models/pagination.interface';
import { Pagination } from '../../../../../shared/components/pagination/pagination';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SkeletonPage, Pagination],
  templateUrl: './role-list.html',
  styleUrl: './role-list.css'
})
export class RoleList implements OnInit {
  usersPage!: Page<User>;
  isLoading = false;
  
  // Pagination
  currentPage = 0;
  pageSize = 10;
  
  // Filters
  searchTerm = '';
  selectedRole = '';

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private successModalService: SuccessModalService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    
    const pageable: Pageable = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: 'firstName',
      sortDirection: 'ASC'
    };

    const params: any = {};
    if (this.searchTerm.trim()) {
      params.searchTerm = this.searchTerm.trim();
    }
    if (this.selectedRole) {
      params.role = this.selectedRole;
    }

    this.api.get<Page<User>>('/users', { ...pageable, ...params }).subscribe({
      next: (usersPage) => {
        this.usersPage = usersPage;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.isLoading = false;
      }
    });
  }

  updateRole(user: User, role: 'ADMIN'|'CUSTOMER'|'GUEST'): void {
    this.api.patch<User>(`/users/${user.id}/role`, { role }).subscribe({
      next: (res) => {
        user.role = res.role as any;
        this.successModalService.showEntityUpdated('User Role', `Role for ${user.firstName} ${user.lastName} has been updated to ${role}`);
      },
      error: (error) => {
        console.error('Error updating user role:', error);
      }
    });
  }

  onRoleChange(user: User, event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    if (selectElement && selectElement.value) {
      const newRole = selectElement.value as 'ADMIN'|'CUSTOMER'|'GUEST';
      this.updateRole(user, newRole);
    }
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadUsers();
  }

  onSearchChange(): void {
    this.currentPage = 0; // Reset to first page when searching
    this.loadUsers();
  }

  onRoleFilterChange(): void {
    this.currentPage = 0; // Reset to first page when filtering
    this.loadUsers();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedRole = '';
    this.currentPage = 0;
    this.loadUsers();
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-500/20 text-red-400';
      case 'CUSTOMER':
        return 'bg-blue-500/20 text-blue-400';
      case 'GUEST':
        return 'bg-gray-500/20 text-gray-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  }

  getRoleOptions(): string[] {
    return ['ADMIN', 'CUSTOMER', 'GUEST'];
  }

  protected readonly HTMLSelectElement = HTMLSelectElement;
}
