import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api';
import { Page, Pageable } from '../../../../core/models/pagination.interface';
import { Modal } from '../../../../shared/components/modal/modal';
import { ConfigrmDialog, DialogActionType } from '../../../../shared/components/configrm-dialog/configrm-dialog';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { VehicleBrand } from '../../../../core/models/vehicle-brand.interface';
import { CreateVehicleBrandDto, UpdateVehicleBrandDto } from '../../../../core/models/vehicle-create-update.interface';
import { SuccessModalService } from '../../../../shared/services/success-modal.service';
import { ActionIcons } from '../../../../shared/components/action-icons/action-icons';
import { SkeletonPage } from '../../../../shared/components/skeleton-page/skeleton-page';
import { InactiveWarningModal } from '../../../../shared/components/inactive-warning-modal/inactive-warning-modal';
import { VehicleStatusService } from '../../../../core/services/vehicle-status.service';

@Component({
  selector: 'app-vehicle-brands',
  standalone: true,
  imports: [CommonModule, FormsModule, Modal, ConfigrmDialog, Pagination, InactiveWarningModal, ActionIcons, SkeletonPage],
  templateUrl: './vehicle-brands.html',
  styleUrl: './vehicle-brands.css'
})
export class VehicleBrands implements OnInit {

  brandsPage!: Page<VehicleBrand>;
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
  currentBrand: Partial<VehicleBrand> = {
    name: '',
    description: '',
    logoUrl: '',
    countryOfOrigin: '',
    isActive: true
  };

  brandToDelete: VehicleBrand | null = null;
  brandToToggle: VehicleBrand | null = null;
  statusInfo: any = null;



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
    this.loadBrands();
  }

  loadBrands(): void {
    this.isLoading = true;
    const pageable: Pageable = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };

    this.apiService.get<Page<VehicleBrand>>('/admin/vehicle-brands', pageable).subscribe({
      next: (page) => {
        this.brandsPage = page;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading brands:', error);
        this.isLoading = false;
        this.showMessage('Error loading brands', 'error');
      }
    });
  }

  openAddModal(): void {
    this.currentBrand = {
      name: '',
      description: '',
      logoUrl: '',
      countryOfOrigin: '',
      isActive: true
    };
    this.showAddModal = true;
  }

  openEditModal(brand: VehicleBrand): void {
    this.currentBrand = { ...brand };
    this.showEditModal = true;
  }

  openDeleteModal(brand: VehicleBrand): void {
    this.brandToDelete = brand;
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
    this.brandToDelete = null;
  }

  saveBrand(): void {
    if (!this.currentBrand.name?.trim()) {
      this.showMessage('Brand name is required', 'error');
      return;
    }

    this.isSaving = true;
    this.clearMessage();

    if (this.currentBrand.id) {
      // Update existing - use UpdateVehicleBrandDto
      const updateDto: UpdateVehicleBrandDto = {
        name: this.currentBrand.name,
        description: this.currentBrand.description,
        logoUrl: this.currentBrand.logoUrl,
        countryOfOrigin: this.currentBrand.countryOfOrigin,
        isActive: this.currentBrand.isActive
      };
      
      this.apiService.put<VehicleBrand>(`/admin/vehicle-brands/${this.currentBrand.id}`, updateDto).subscribe({
        next: () => {
          this.successModalService.showEntityUpdated('Brand', `Brand ${this.currentBrand.name} has been successfully updated`);
          this.closeEditModal();
          this.loadBrands();
        },
        error: (error) => {
          console.error('Error updating brand:', error);
          this.showMessage('Error updating brand', 'error');
        },
        complete: () => {
          this.isSaving = false;
        }
      });
    } else {
      // Create new - use CreateVehicleBrandDto
      const createDto: CreateVehicleBrandDto = {
        name: this.currentBrand.name!,
        description: this.currentBrand.description,
        logoUrl: this.currentBrand.logoUrl,
        countryOfOrigin: this.currentBrand.countryOfOrigin
      };
      
      this.apiService.post<VehicleBrand>('/admin/vehicle-brands', createDto).subscribe({
        next: () => {
          this.successModalService.showEntityCreated('Brand', `Brand ${this.currentBrand.name} has been successfully created`);
          this.closeAddModal();
          this.loadBrands();
        },
        error: (error) => {
          console.error('Error creating brand:', error);
          this.showMessage('Error creating brand', 'error');
        },
        complete: () => {
          this.isSaving = false;
        }
      });
    }
  }

  confirmDeleteBrand(): void {
    if (!this.brandToDelete?.id) return;

    this.isSaving = true;
    this.apiService.delete(`/admin/vehicle-brands/${this.brandToDelete.id}`).subscribe({
      next: () => {
        this.successModalService.showEntityDeleted('Brand', `Brand ${this.brandToDelete!.name} has been successfully deleted`);
        this.closeDeleteModal();
        this.loadBrands();
      },
      error: (error) => {
        console.error('Error deleting brand:', error);
        this.showMessage('Error deleting brand', 'error');
      },
      complete: () => {
        this.isSaving = false;
      }
    });
  }

  toggleBrandStatus(brand: VehicleBrand): void {
    if (!brand.id) return;

    // If setting to inactive, show warning modal with real data
    if (brand.isActive) {
      this.brandToToggle = brand;
      this.vehicleStatusService.getBrandStatusInfo(brand.id).subscribe({
        next: (statusInfo) => {
          this.statusInfo = statusInfo;
          this.showInactiveWarningModal = true;
        },
        error: (error) => {
          console.error('Error loading brand status info:', error);
          // Fallback to simple toggle without warning
          this.confirmToggleStatus(brand);
        }
      });
    } else {
      // Activating - no warning needed
      this.confirmToggleStatus(brand);
    }
  }

  confirmToggleStatus(brand: VehicleBrand): void {
    if (!brand.id) return;

    this.apiService.patch<VehicleBrand>(`/admin/vehicle-brands/${brand.id}/toggle-status`, {}).subscribe({
      next: (updatedBrand) => {
        const action = updatedBrand.isActive ? 'activated' : 'deactivated';
        this.successModalService.show({
          title: `Brand ${action}`,
          message: `${brand.name} has been successfully ${action}.`,
          autoClose: true,
          autoCloseDelay: 3000
        });
        this.loadBrands();
      },
      error: (error) => {
        console.error('Error toggling brand status:', error);
        this.showMessage('Error updating brand status', 'error');
      }
    });
  }

  onInactiveConfirm(): void {
    if (this.brandToToggle) {
      this.confirmToggleStatus(this.brandToToggle);
      this.closeInactiveWarningModal();
    }
  }

  onInactiveCancel(): void {
    this.closeInactiveWarningModal();
  }

  closeInactiveWarningModal(): void {
    this.showInactiveWarningModal = false;
    this.brandToToggle = null;
    this.statusInfo = null;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadBrands();
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
    const pageable: Pageable = { page: 0, size: this.brandsPage?.totalElements || 10000, sortBy: this.sortBy, sortDirection: this.sortDirection };
    this.apiService.get<Page<VehicleBrand>>('/admin/vehicle-brands', pageable).subscribe({
      next: (page) => {
        const headers = ['ID','Name','Description','Country','Active','Created','Updated'];
        const rows = page.content.map(b => [b.id,b.name,b.description || '',b.countryOfOrigin || '',b.isActive, b.createdAt, b.updatedAt].map(x => `"${x ?? ''}"`).join(','));
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'vehicle-brands.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  }
}
