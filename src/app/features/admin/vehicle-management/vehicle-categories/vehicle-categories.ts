import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api';
import { Page, Pageable } from '../../../../core/models/pagination.interface';
import { Modal } from '../../../../shared/components/modal/modal';
import { ConfigrmDialog, DialogActionType } from '../../../../shared/components/configrm-dialog/configrm-dialog';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { VehicleCategory, CreateVehicleCategoryDto, UpdateVehicleCategoryDto } from '../../../../core/models/vehicle-category.interface';
import { InactiveWarningModal } from '../../../../shared/components/inactive-warning-modal/inactive-warning-modal';
import { SuccessModalService } from '../../../../shared/services/success-modal.service';
import { ActionIcons } from '../../../../shared/components/action-icons/action-icons';
import { SkeletonPage } from '../../../../shared/components/skeleton-page/skeleton-page';
import { VehicleStatusService, VehicleStatusInfo } from '../../../../core/services/vehicle-status.service';

@Component({
  selector: 'app-vehicle-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, Modal, ConfigrmDialog, Pagination, InactiveWarningModal, ActionIcons, SkeletonPage],
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
  showInactiveWarningModal = false;

  // Form data
  currentCategory: Partial<VehicleCategory> = {
    name: '',
    description: '',
    iconUrl: '',
    isActive: true
  };

  categoryToDelete: VehicleCategory | null = null;
  categoryToToggle: VehicleCategory | null = null;
  statusInfo: VehicleStatusInfo | null = null;

  // Pagination
  currentPage = 0;
  pageSize = 10;
  sortBy = 'name';
  sortDirection: 'ASC' | 'DESC' = 'ASC';

  // Expose DialogActionType to the template
  readonly DialogActionType = DialogActionType;

  constructor(
    private apiService: ApiService,
    private successModalService: SuccessModalService,
    private vehicleStatusService: VehicleStatusService
  ) {}

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
      isActive: true
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
    if (!this.currentCategory.name?.trim()) {
      this.showMessage('Category name is required', 'error');
      return;
    }

    this.isSaving = true;
    this.clearMessage();

    if (this.currentCategory.id) {
      // Update existing - use UpdateVehicleCategoryDto
      const updateDto: UpdateVehicleCategoryDto = {
        name: this.currentCategory.name,
        description: this.currentCategory.description,
        iconUrl: this.currentCategory.iconUrl,
        isActive: this.currentCategory.isActive
      };
      
      this.apiService.put<VehicleCategory>(`/admin/vehicle-categories/${this.currentCategory.id}`, updateDto).subscribe({
        next: () => {
          this.successModalService.showEntityUpdated('Category', `${this.currentCategory.name} has been updated`);
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
      // Create new - use CreateVehicleCategoryDto
      const createDto: CreateVehicleCategoryDto = {
        name: this.currentCategory.name!,
        description: this.currentCategory.description,
        iconUrl: this.currentCategory.iconUrl
      };
      
      this.apiService.post<VehicleCategory>('/admin/vehicle-categories', createDto).subscribe({
        next: () => {
          this.successModalService.showEntityCreated('Category', `${this.currentCategory.name} has been added to the system`);
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
        this.successModalService.showEntityDeleted('Category', `${this.categoryToDelete!.name} has been removed from the system`);
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

    // If setting to inactive, show warning modal with real data
    if (category.isActive) {
      this.categoryToToggle = category;
      this.vehicleStatusService.getCategoryStatusInfo(category.id).subscribe({
        next: (statusInfo) => {
          this.statusInfo = statusInfo;
          this.showInactiveWarningModal = true;
        },
        error: (error) => {
          console.error('Error fetching category status info:', error);
          // Fallback to simple confirmation without detailed info
          this.confirmToggleStatus(category);
        }
      });
    } else {
      // Activating - no warning needed
      this.confirmToggleStatus(category);
    }
  }

  confirmToggleStatus(category?: VehicleCategory): void {
    const categoryToUpdate = category || this.categoryToToggle;
    if (!categoryToUpdate?.id) return;

    this.apiService.patch<VehicleCategory>(`/admin/vehicle-categories/${categoryToUpdate.id}/toggle-status`, {}).subscribe({
      next: (updatedCategory) => {
        const action = updatedCategory.isActive ? 'activated' : 'deactivated';
        this.successModalService.show({
          title: `Category ${action}`,
          message: `${categoryToUpdate.name} has been successfully ${action}.`,
          details: updatedCategory.isActive 
            ? 'Vehicles in this category are now available for rental.' 
            : 'Vehicles in this category are no longer available for new reservations.',
          autoClose: true,
          autoCloseDelay: 3000
        });
        this.closeInactiveWarningModal();
        this.loadCategories();
      },
      error: (error) => {
        console.error('Error toggling category status:', error);
        this.showMessage('Error updating category status', 'error');
        this.closeInactiveWarningModal();
      }
    });
  }

  closeInactiveWarningModal(): void {
    this.showInactiveWarningModal = false;
    this.categoryToToggle = null;
    this.statusInfo = null;
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
  exportToCSV(): void {
    const pageable: Pageable = { page: 0, size: this.categoriesPage?.totalElements || 10000, sortBy: this.sortBy, sortDirection: this.sortDirection };
    this.apiService.get<Page<VehicleCategory>>('/admin/vehicle-categories', pageable).subscribe({
      next: (page) => {
        const headers = ['ID','Name','Description','Active','Created','Updated'];
        const rows = page.content.map(c => [c.id,c.name,c.description || '',c.isActive, c.createdAt, c.updatedAt].map(x => `"${x ?? ''}"`).join(','));
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'vehicle-categories.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  }
}
