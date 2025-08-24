import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api';
import { Page, Pageable } from '../../../../core/models/pagination.interface';
import { Modal } from '../../../../shared/components/modal/modal';
import { ConfigrmDialog, DialogActionType } from '../../../../shared/components/configrm-dialog/configrm-dialog';
import { Pagination } from '../../../../shared/components/pagination/pagination';

interface VehicleBrand {
  id?: number;
  name: string;
  description?: string;
  logoUrl?: string;
  countryOfOrigin?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-vehicle-brands',
  standalone: true,
  imports: [CommonModule, FormsModule, Modal, ConfigrmDialog, Pagination],
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

  // Form data
  currentBrand: VehicleBrand = {
    name: '',
    description: '',
    logoUrl: '',
    countryOfOrigin: '',
    isActive: true
  };

  brandToDelete: VehicleBrand | null = null;

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
    if (!this.currentBrand.name.trim()) {
      this.showMessage('Brand name is required', 'error');
      return;
    }

    this.isSaving = true;
    this.clearMessage();

    if (this.currentBrand.id) {
      // Update existing
      this.apiService.put<VehicleBrand>(`/admin/vehicle-brands/${this.currentBrand.id}`, this.currentBrand).subscribe({
        next: () => {
          this.showMessage('Brand updated successfully!', 'success');
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
      // Create new
      this.apiService.post<VehicleBrand>('/admin/vehicle-brands', this.currentBrand).subscribe({
        next: () => {
          this.showMessage('Brand created successfully!', 'success');
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
        this.showMessage('Brand deleted successfully!', 'success');
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

    const updatedBrand = { ...brand, isActive: !brand.isActive };
    this.apiService.patch<VehicleBrand>(`/admin/vehicle-brands/${brand.id}/toggle-status`, updatedBrand).subscribe({
      next: () => {
        this.loadBrands();
      },
      error: (error) => {
        console.error('Error toggling brand status:', error);
        this.showMessage('Error updating brand status', 'error');
      }
    });
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

}
