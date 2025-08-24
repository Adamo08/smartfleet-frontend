import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api';
import { Page, Pageable } from '../../../../core/models/pagination.interface';
import { Modal } from '../../../../shared/components/modal/modal';
import { ConfigrmDialog, DialogActionType } from '../../../../shared/components/configrm-dialog/configrm-dialog';
import { Pagination } from '../../../../shared/components/pagination/pagination';

interface VehicleCategory {
  id?: number;
  name: string;
  description?: string;
  iconUrl?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-vehicle-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, Modal, ConfigrmDialog, Pagination],
  templateUrl: './vehicle-categories.html',
  styleUrl: './vehicle-categories.css'
})
export class VehicleCategories implements OnInit {

  categoriesPage!: Page<VehicleCategory>;
  isLoading = false;
  isSaving = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  // Modal states
  showAddModal = false;
  showEditModal = false;
  showDeleteModal = false;

  // Form data
  currentCategory: VehicleCategory = {
    name: '',
    description: '',
    iconUrl: '',
    isActive: true,
    createdAt: '',
    updatedAt: '',
  };

  categoryToDelete: VehicleCategory | null = null;

  // Pagination
  currentPage = 0;
  pageSize = 10;
  sortBy = 'name';
  sortDirection: 'ASC' | 'DESC' = 'ASC';

  // Expose DialogActionType to the template
  readonly DialogActionType = DialogActionType;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;
    const pageable: Pageable = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };

    this.apiService.get<Page<VehicleCategory>>('/admin/vehicle-categories', pageable).subscribe({
      next: (page) => {
        this.categoriesPage = page;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.isLoading = false;
        this.showMessage('Error loading categories', 'error');
      }
    });
  }

  openAddModal(): void {
    this.currentCategory = {
      name: '',
      description: '',
      iconUrl: '',
      isActive: true,
      createdAt: '',
      updatedAt: '',
    };
    this.showAddModal = true;
  }

  openEditModal(category: VehicleCategory): void {
    this.currentCategory = { ...category };
    this.showEditModal = true;
  }

  openDeleteModal(category: VehicleCategory): void {
    this.categoryToDelete = category;
    this.showDeleteModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.clearMessage();
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.clearMessage();
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.categoryToDelete = null;
  }

  saveCategory(): void {
    if (!this.currentCategory.name.trim()) {
      this.showMessage('Category name is required', 'error');
      return;
    }

    this.isSaving = true;
    this.clearMessage();

    if (this.currentCategory.id) {
      // Update existing
      this.apiService.put<VehicleCategory>(`/admin/vehicle-categories/${this.currentCategory.id}`, this.currentCategory).subscribe({
        next: () => {
          this.showMessage('Category updated successfully!', 'success');
          this.closeEditModal();
          this.loadCategories();
        },
        error: (error) => {
          console.error('Error updating category:', error);
          this.showMessage('Error updating category', 'error');
        },
        complete: () => {
          this.isSaving = false;
        }
      });
    } else {
      // Create new
      this.apiService.post<VehicleCategory>('/admin/vehicle-categories', this.currentCategory).subscribe({
        next: () => {
          this.showMessage('Category created successfully!', 'success');
          this.closeAddModal();
          this.loadCategories();
        },
        error: (error) => {
          console.error('Error creating category:', error);
          this.showMessage('Error creating category', 'error');
        },
        complete: () => {
          this.isSaving = false;
        }
      });
    }
  }

  confirmDeleteCategory(): void {
    if (!this.categoryToDelete?.id) return;

    this.isSaving = true;
    this.apiService.delete(`/admin/vehicle-categories/${this.categoryToDelete.id}`).subscribe({
      next: () => {
        this.showMessage('Category deleted successfully!', 'success');
        this.closeDeleteModal();
        this.loadCategories();
      },
      error: (error) => {
        console.error('Error deleting category:', error);
        this.showMessage('Error deleting category', 'error');
      },
      complete: () => {
        this.isSaving = false;
      }
    });
  }

  toggleCategoryStatus(category: VehicleCategory): void {
    if (!category.id) return;

    const updatedCategory = { ...category, isActive: !category.isActive };
    this.apiService.patch<VehicleCategory>(`/admin/vehicle-categories/${category.id}/toggle-status`, updatedCategory).subscribe({
      next: () => {
        this.loadCategories();
      },
      error: (error) => {
        console.error('Error toggling category status:', error);
        this.showMessage('Error updating category status', 'error');
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadCategories();
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
  }

  public clearMessage(): void {
    this.message = '';
  }

  protected readonly Math = Math;
}
