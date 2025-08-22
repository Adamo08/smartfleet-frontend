import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../../core/services/api';
import { User, UserRole } from '../../../../core/models/user.interface';
import { Page, Pageable, Sort } from '../../../../core/models/pagination.interface';
import { Modal } from '../../../../shared/components/modal/modal';
import { UserDetail } from '../user-detail/user-detail';
import { UserForm } from '../user-form/user-form';
import { ConfigrmDialog, DialogActionType } from '../../../../shared/components/configrm-dialog/configrm-dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Pagination } from '../../../../shared/components/pagination/pagination';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterModule, Modal, UserDetail, UserForm, ConfigrmDialog, FormsModule, ReactiveFormsModule, Pagination],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css'
})
export class UserList implements OnInit {
  usersPage!: Page<User>;
  isLoading = false;
  currentPage = 0;
  pageSize = 10;
  sortBy = 'id';
  sortDirection: 'ASC' | 'DESC' = 'ASC';

  selectedUser: User | null = null;
  showUserDetailModal = false;
  showAddUserModal = false;
  showEditUserModal = false;
  showDeleteUserModal = false;
  userToDelete: User | null = null;

  searchTerm: string = '';
  selectedRole: string = ''; // For filter by role
  userRoles: string[] = Object.values(UserRole); // Get all user roles from enum

  // Expose DialogActionType to the template
  readonly DialogActionType = DialogActionType;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    const pageable: Pageable = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };

    let url = `/users?page=${pageable.page}&size=${pageable.size}&sortBy=${pageable.sortBy}&sortDirection=${pageable.sortDirection}`;
    if (this.searchTerm) {
      url += `&searchTerm=${this.searchTerm}`;
    }
    if (this.selectedRole) {
      url += `&role=${this.selectedRole}`;
    }

    this.api.get<Page<User>>(url).subscribe({
      next: (page) => {
        this.usersPage = page;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadUsers();
  }

  onSortChange(sortBy: string, sortDirection: 'ASC' | 'DESC'): void {
    this.sortBy = sortBy;
    this.sortDirection = sortDirection;
    this.loadUsers();
  }

  onSearchTermChange(term: string): void {
    this.searchTerm = term;
    this.currentPage = 0; // Reset to first page on new search
    this.loadUsers();
  }

  onRoleFilterChange(role: string): void {
    this.selectedRole = role;
    this.currentPage = 0; // Reset to first page on new filter
    this.loadUsers();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedRole = '';
    this.currentPage = 0;
    this.loadUsers();
  }

  exportUsers(): void {
    // Fetch all users (or filtered users without pagination) for export
    let exportUrl = `/users?size=${this.usersPage.totalElements}`;
    if (this.searchTerm) {
      exportUrl += `&searchTerm=${this.searchTerm}`;
    }
    if (this.selectedRole) {
      exportUrl += `&role=${this.selectedRole}`;
    }

    this.api.get<Page<User>>(exportUrl).subscribe({
      next: (page) => {
        const usersToExport = page.content;
        const csvContent = this.convertToCsv(usersToExport);
        this.downloadCsv(csvContent, 'users.csv');
      },
      error: (err) => console.error('Error exporting users:', err)
    });
  }

  private convertToCsv(data: User[]): string {
    const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Phone Number', 'Role', 'Auth Provider', 'Created At', 'Updated At'];
    const rows = data.map(user => [
      user.id,
      user.firstName,
      user.lastName,
      user.email,
      user.phoneNumber || '',
      user.role,
      user.authProvider || '',
      user.createdAt,
      user.updatedAt
    ].map(field => `"${field}"`).join(',')); // Wrap fields in quotes to handle commas

    return [headers.join(','), ...rows].join('\n');
  }

  private downloadCsv(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  viewUser(user: User): void {
    this.selectedUser = user;
    this.showUserDetailModal = true;
  }

  closeUserDetailModal(): void {
    this.showUserDetailModal = false;
    this.selectedUser = null;
  }

  openAddUserModal(): void {
    this.showAddUserModal = true;
  }

  closeAddUserModal(): void {
    this.showAddUserModal = false;
    this.loadUsers();
  }

  openEditUserModal(user: User): void {
    this.selectedUser = user;
    this.showEditUserModal = true;
  }

  closeEditUserModal(): void {
    this.showEditUserModal = false;
    this.selectedUser = null;
    this.loadUsers();
  }

  openDeleteUserModal(user: User): void {
    this.userToDelete = user;
    this.showDeleteUserModal = true;
  }

  confirmDeleteUser(): void {
    if (this.userToDelete) {
      this.api.delete(`/users/${this.userToDelete.id}`).subscribe({
        next: () => {
          this.closeDeleteUserModal();
          this.loadUsers();
        },
        error: (err) => console.error('Error deleting user:', err)
      });
    }
  }

  closeDeleteUserModal(): void {
    this.showDeleteUserModal = false;
    this.userToDelete = null;
  }
}
