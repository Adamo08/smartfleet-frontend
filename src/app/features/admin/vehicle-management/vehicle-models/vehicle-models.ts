import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api';
import { Page, Pageable } from '../../../../core/models/pagination.interface';
import { Modal } from '../../../../shared/components/modal/modal';
import { ConfigrmDialog, DialogActionType } from '../../../../shared/components/configrm-dialog/configrm-dialog';
import { Pagination } from '../../../../shared/components/pagination/pagination';

interface VehicleBrand {
  id: number;
  name: string;
}

interface VehicleModel {
  id?: number;
  name: string;
  brandId: number;
  brandName?: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-vehicle-models',
  standalone: true,
  imports: [CommonModule, FormsModule, Modal, ConfigrmDialog, Pagination],
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

  // Form data
  currentModel: VehicleModel = {
    name: '',
    brandId: 0,
    description: '',
    isActive: true,
    createdAt: '',
    updatedAt: '',
  };

  modelToDelete: VehicleModel | null = null;

  // Pagination
  currentPage = 0;
  pageSize = 10;
  sortBy = 'name';
  sortDirection: 'ASC' | 'DESC' = 'ASC';

  // Expose DialogActionType to the template
  readonly DialogActionType = DialogActionType;

  constructor(private apiService: ApiService) {}

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
      isActive: true,
      createdAt: '',
      updatedAt: '',
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
    if (!this.currentModel.name.trim()) {
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
      // Update existing
      this.apiService.put<VehicleModel>(`/admin/vehicle-models/${this.currentModel.id}`, this.currentModel).subscribe({
        next: () => {
          this.showMessage('Model updated successfully!', 'success');
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
      // Create new
      this.apiService.post<VehicleModel>('/admin/vehicle-models', this.currentModel).subscribe({
        next: () => {
          this.showMessage('Model created successfully!', 'success');
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
        this.showMessage('Model deleted successfully!', 'success');
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

    const updatedModel = { ...model, isActive: !model.isActive };
    this.apiService.patch<VehicleModel>(`/admin/vehicle-models/${model.id}/toggle-status`, updatedModel).subscribe({
      next: () => {
        this.loadModels();
      },
      error: (error) => {
        console.error('Error toggling model status:', error);
        this.showMessage('Error updating model status', 'error');
      }
    });
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

}
