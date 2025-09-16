import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api';
import { Page, Pageable } from '../../../../core/models/pagination.interface';
import { Modal } from '../../../../shared/components/modal/modal';
import { ConfigrmDialog, DialogActionType } from '../../../../shared/components/configrm-dialog/configrm-dialog';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { VehicleBrand } from '../../../../core/models/vehicle-brand.interface';
import { VehicleModel } from '../../../../core/models/vehicle-model.interface';
import { CreateVehicleModelDto, UpdateVehicleModelDto } from '../../../../core/models/vehicle-create-update.interface';
import { ActionIcons } from '../../../../shared/components/action-icons/action-icons';
import { SuccessModalService } from '../../../../shared/services/success-modal.service';
import { SkeletonPage } from '../../../../shared/components/skeleton-page/skeleton-page';
import { InactiveWarningModal } from '../../../../shared/components/inactive-warning-modal/inactive-warning-modal';
import { VehicleStatusService } from '../../../../core/services/vehicle-status.service';

@Component({
  selector: 'app-vehicle-models',
  standalone: true,
  imports: [CommonModule, FormsModule, Modal, ConfigrmDialog, Pagination, InactiveWarningModal, ActionIcons, SkeletonPage],
  templateUrl: './vehicle-models.html',
  styleUrl: './vehicle-models.css'
})
export class VehicleModels implements OnInit {

  modelsPage!: Page<VehicleModel>;
  brands: VehicleBrand[] = [];
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
  currentModel: Partial<VehicleModel> = {
    name: '',
    brandId: 0,
    description: '',
    isActive: true
  };

  modelToDelete: VehicleModel | null = null;
  modelToToggle: VehicleModel | null = null;
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
    this.loadModels();
  }

  loadBrands(): void {
    // Assuming getAllBrands returns a Page<VehicleBrand> and we need all brands for the dropdown
    // Adjust this if your API has a dedicated endpoint for non-paginated brands list
    this.apiService.get<Page<VehicleBrand>>('/admin/vehicle-brands', { page: 0, size: 9999, sortBy: 'name', sortDirection: 'ASC' }).subscribe({
      next: (page) => {
        this.brands = page.content;
        if (this.currentModel.brandId === 0 && this.brands.length > 0) {
          this.currentModel.brandId = this.brands[0].id;
        }
      },
      error: (error) => {
        console.error('Error loading brands:', error);
      }
    });
  }

  loadModels(): void {
    this.isLoading = true;
    const pageable: Pageable = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };

    this.apiService.get<Page<VehicleModel>>('/admin/vehicle-models', pageable).subscribe({
      next: (page) => {
        this.modelsPage = page;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading models:', error);
        this.isLoading = false;
        this.showMessage('Error loading models', 'error');
      }
    });
  }

  openAddModal(): void {
    this.currentModel = {
      name: '',
      brandId: this.brands.length > 0 ? this.brands[0].id : 0,
      description: '',
      isActive: true
    };
    this.showAddModal = true;
  }

  openEditModal(model: VehicleModel): void {
    this.currentModel = { ...model };
    this.showEditModal = true;
  }

  openDeleteModal(model: VehicleModel): void {
    this.modelToDelete = model;
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
    this.modelToDelete = null;
  }

  saveModel(): void {
    if (!this.currentModel.name?.trim()) {
      this.showMessage('Model name is required', 'error');
      return;
    }

    if (!this.currentModel.brandId) {
      this.showMessage('Brand is required', 'error');
      return;
    }

    this.isSaving = true;
    this.clearMessage();

    if (this.currentModel.id) {
      // Update existing - use UpdateVehicleModelDto
      const updateDto: UpdateVehicleModelDto = {
        name: this.currentModel.name,
        brandId: this.currentModel.brandId,
        description: this.currentModel.description,
        isActive: this.currentModel.isActive
      };
      
      this.apiService.put<VehicleModel>(`/admin/vehicle-models/${this.currentModel.id}`, updateDto).subscribe({
        next: () => {
          this.successModalService.showEntityUpdated('Model', `Model ${this.currentModel.name} has been successfully updated`);
          this.closeEditModal();
          this.loadModels();
        },
        error: (error) => {
          console.error('Error updating model:', error);
          this.showMessage('Error updating model', 'error');
        },
        complete: () => {
          this.isSaving = false;
        }
      });
    } else {
      // Create new - use CreateVehicleModelDto
      const createDto: CreateVehicleModelDto = {
        name: this.currentModel.name!,
        brandId: this.currentModel.brandId!,
        description: this.currentModel.description
      };
      
      this.apiService.post<VehicleModel>('/admin/vehicle-models', createDto).subscribe({
        next: () => {
          this.successModalService.showEntityCreated('Model', `Model ${this.currentModel.name} has been successfully created`);
          this.closeAddModal();
          this.loadModels();
        },
        error: (error) => {
          console.error('Error creating model:', error);
          this.showMessage('Error creating model', 'error');
        },
        complete: () => {
          this.isSaving = false;
        }
      });
    }
  }

  confirmDeleteModel(): void {
    if (!this.modelToDelete?.id) return;

    this.isSaving = true;
    this.apiService.delete(`/admin/vehicle-models/${this.modelToDelete.id}`).subscribe({
      next: () => {
        this.successModalService.showEntityDeleted('Model', `Model ${this.modelToDelete!.name} has been successfully deleted`);
        this.closeDeleteModal();
        this.loadModels();
      },
      error: (error) => {
        console.error('Error deleting model:', error);
        this.showMessage('Error deleting model', 'error');
      },
      complete: () => {
        this.isSaving = false;
      }
    });
  }

  toggleModelStatus(model: VehicleModel): void {
    if (!model.id) return;

    // If setting to inactive, show warning modal with real data
    if (model.isActive) {
      this.modelToToggle = model;
      this.vehicleStatusService.getModelStatusInfo(model.id).subscribe({
        next: (statusInfo) => {
          this.statusInfo = statusInfo;
          this.showInactiveWarningModal = true;
        },
        error: (error) => {
          console.error('Error loading model status info:', error);
          // Fallback to simple toggle without warning
          this.confirmToggleStatus(model);
        }
      });
    } else {
      // Activating - no warning needed
      this.confirmToggleStatus(model);
    }
  }

  confirmToggleStatus(model: VehicleModel): void {
    if (!model.id) return;

    this.apiService.patch<VehicleModel>(`/admin/vehicle-models/${model.id}/toggle-status`, {}).subscribe({
      next: (updatedModel) => {
        const action = updatedModel.isActive ? 'activated' : 'deactivated';
        this.successModalService.show({
          title: `Model ${action}`,
          message: `${model.name} has been successfully ${action}.`,
          autoClose: true,
          autoCloseDelay: 3000
        });
        this.loadModels();
      },
      error: (error) => {
        console.error('Error toggling model status:', error);
        this.showMessage('Error updating model status', 'error');
      }
    });
  }

  onInactiveConfirm(): void {
    if (this.modelToToggle) {
      this.confirmToggleStatus(this.modelToToggle);
      this.closeInactiveWarningModal();
    }
  }

  onInactiveCancel(): void {
    this.closeInactiveWarningModal();
  }

  closeInactiveWarningModal(): void {
    this.showInactiveWarningModal = false;
    this.modelToToggle = null;
    this.statusInfo = null;
  }

  getBrandName(brandId: number): string {
    const brand = this.brands.find(b => b.id === brandId);
    return brand ? brand.name : 'Unknown Brand';
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadModels();
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
    const pageable: Pageable = { page: 0, size: this.modelsPage?.totalElements || 10000, sortBy: this.sortBy, sortDirection: this.sortDirection };
    this.apiService.get<Page<VehicleModel>>('/admin/vehicle-models', pageable).subscribe({
      next: (page) => {
        const headers = ['ID','Name','BrandId','Description','Active','Created','Updated'];
        const rows = page.content.map(m => [m.id,m.name,m.brandId,m.description || '',m.isActive, m.createdAt, m.updatedAt].map(x => `"${x ?? ''}"`).join(','));
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'vehicle-models.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  }
}
