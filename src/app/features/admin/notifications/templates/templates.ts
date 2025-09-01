import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NotificationType } from '../../../../core/services/notification';
import { AdminNotificationService, EmailTemplateMetadata } from '../../../../core/services/admin-notification.service';
import { ToastrService } from 'ngx-toastr';

interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  templateCount: number;
}

@Component({
  selector: 'app-templates',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './templates.html',
  styleUrl: './templates.css'
})
export class Templates implements OnInit {
  emailTemplates: EmailTemplateMetadata[] = [];
  selectedTemplate: EmailTemplateMetadata | null = null;
  activeTab: 'overview' | 'preview' | 'variables' | 'editor' = 'overview';
  searchTerm = '';
  selectedCategory = '';
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  templateToDelete: EmailTemplateMetadata | null = null;
  isSaving = false;
  isLoading = false;

  // Form for creating/editing templates
  templateForm: FormGroup;

  constructor(
    public adminNotificationService: AdminNotificationService,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this.templateForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      type: [NotificationType.GENERAL_UPDATE, Validators.required],
      subject: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      category: ['', Validators.required],
      icon: ['📧', Validators.required],
      color: ['blue', Validators.required],
      templateFile: ['', Validators.required],
      variables: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.isLoading = true;
    this.adminNotificationService.getEmailTemplates().subscribe({
      next: (response) => {
        this.emailTemplates = response.content || [];
        if (this.emailTemplates.length > 0) {
          this.selectedTemplate = this.emailTemplates[0];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading templates:', error);
        this.toastr.error('Failed to load templates');
        this.isLoading = false;
      }
    });
  }

  selectTemplate(template: EmailTemplateMetadata): void {
    this.selectedTemplate = template;
    this.activeTab = 'overview';
  }

  setActiveTab(tab: string): void {
    if (tab === 'overview' || tab === 'preview' || tab === 'variables' || tab === 'editor') {
      this.activeTab = tab as 'overview' | 'preview' | 'variables' | 'editor';
    }
  }

  openCreateModal(): void {
    this.templateForm.reset({
      type: NotificationType.GENERAL_UPDATE,
      icon: '📧',
      color: 'blue'
    });
    this.showCreateModal = true;
  }

  openEditModal(template: EmailTemplateMetadata): void {
    this.templateForm.patchValue({
      name: template.name,
      type: template.type,
      subject: template.subject,
      description: template.description,
      category: template.category,
      icon: template.icon,
      color: template.color,
      templateFile: template.templateFile,
      variables: template.variables.join(', ')
    });
    this.showEditModal = true;
  }

  openDeleteModal(template: EmailTemplateMetadata): void {
    this.templateToDelete = template;
    this.showDeleteModal = true;
  }

  saveTemplate(): void {
    if (this.templateForm.invalid) {
      this.toastr.error('Please fill in all required fields');
      return;
    }

    this.isSaving = true;
    const formValue = this.templateForm.value;
    
    const templateData = {
      ...formValue,
      variables: formValue.variables.split(',').map((v: string) => v.trim())
    };
    
    if (this.showEditModal && this.selectedTemplate) {
      this.adminNotificationService.updateEmailTemplate(this.selectedTemplate.id, templateData).subscribe({
        next: () => {
          this.toastr.success('Template updated successfully');
          this.loadTemplates();
          this.showEditModal = false;
          this.isSaving = false;
        },
        error: (error) => {
          console.error('Error updating template:', error);
          this.toastr.error('Failed to update template');
          this.isSaving = false;
        }
      });
    } else {
      this.adminNotificationService.createEmailTemplate(templateData).subscribe({
        next: () => {
          this.toastr.success('Template created successfully');
          this.loadTemplates();
          this.showCreateModal = false;
          this.isSaving = false;
        },
        error: (error) => {
          console.error('Error creating template:', error);
          this.toastr.error('Failed to create template');
          this.isSaving = false;
        }
      });
    }
  }

  deleteTemplate(): void {
    if (!this.templateToDelete) return;

    this.adminNotificationService.deleteEmailTemplate(this.templateToDelete.id).subscribe({
      next: () => {
        this.toastr.success('Template deleted successfully');
        this.loadTemplates();
        this.showDeleteModal = false;
        this.templateToDelete = null;
      },
      error: (error) => {
        console.error('Error deleting template:', error);
        this.toastr.error('Failed to delete template');
      }
    });
  }

  toggleTemplateStatus(template: EmailTemplateMetadata): void {
    this.adminNotificationService.toggleTemplateStatus(template.id).subscribe({
      next: () => {
        template.isActive = !template.isActive;
        this.toastr.success(`Template ${template.isActive ? 'activated' : 'deactivated'} successfully`);
      },
      error: (error) => {
        console.error('Error toggling template status:', error);
        this.toastr.error('Failed to update template status');
      }
    });
  }

  duplicateTemplate(template: EmailTemplateMetadata): void {
    this.adminNotificationService.duplicateTemplate(template.id).subscribe({
      next: (duplicatedTemplate) => {
        this.emailTemplates.unshift(duplicatedTemplate);
        this.toastr.success('Template duplicated successfully');
      },
      error: (error) => {
        console.error('Error duplicating template:', error);
        this.toastr.error('Failed to duplicate template');
      }
    });
  }

  onFilterChange(): void {
    // This method is called when filters change
    console.log('Filters changed:', { searchTerm: this.searchTerm, selectedCategory: this.selectedCategory });
  }

  get filteredTemplates(): EmailTemplateMetadata[] {
    let filtered = this.emailTemplates;
    
    if (this.searchTerm) {
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        template.category.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    
    if (this.selectedCategory) {
      filtered = filtered.filter(template => template.category === this.selectedCategory);
    }
    
    return filtered;
  }

  get categories(): TemplateCategory[] {
    const categoryMap = new Map<string, TemplateCategory>();
    
    this.emailTemplates.forEach(template => {
      if (!categoryMap.has(template.category)) {
        categoryMap.set(template.category, {
          id: template.category,
          name: template.category,
          description: `${template.category} related templates`,
          icon: this.getCategoryIcon(template.category),
          color: template.color || 'blue',
          templateCount: 0
        });
      }
      const category = categoryMap.get(template.category);
      if (category) {
        category.templateCount++;
      }
    });
    
    return Array.from(categoryMap.values());
  }

  getCategoryIcon(category: string): string {
    const iconMap: Record<string, string> = {
      'Payment': '💳',
      'Reservation': '📅',
      'Account': '👤',
      'System': '⚙️',
      'Security': '🔒',
      'Feature': '✨'
    };
    return iconMap[category] || '📧';
  }

  getTemplateContent(template: EmailTemplateMetadata): string {
    // Since we're not storing HTML content, we'll show a preview based on the template file
    return `Template: ${template.templateFile}\nSubject: ${template.subject}\nVariables: ${template.variables.join(', ')}`;
  }

  getDefaultTemplateFileName(templateName: string): string {
    return templateName.toLowerCase().replace(/\s+/g, '-') + '-email';
  }

  getColorClass(color: string): string {
    const colorMap: Record<string, string> = {
      'green': 'bg-green-500/20 text-green-300 border-green-500/30',
      'red': 'bg-red-500/20 text-red-300 border-red-500/30',
      'yellow': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'blue': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'orange': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      'gray': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
      'purple': 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    };
    return colorMap[color] || colorMap['gray'];
  }

  getVariableDescription(variable: string): string {
    const descriptions: Record<string, string> = {
      'username': 'User\'s first name',
      'reservationId': 'Reservation ID number',
      'vehicle': 'Vehicle name/model',
      'start': 'Reservation start date/time',
      'end': 'Reservation end date/time',
      'amount': 'Payment amount',
      'currency': 'Currency code (USD, EUR, etc.)',
      'paymentId': 'Payment transaction ID',
      'message': 'Notification message content',
      'notificationType': 'Type of notification',
      'subject': 'Email subject line',
      'resetLink': 'Password reset URL',
      'year': 'Current year',
      'service': 'Service name',
      'startTime': 'Maintenance start time',
      'endTime': 'Maintenance end time',
      'impact': 'Impact description',
      'featureName': 'New feature name',
      'description': 'Feature description',
      'learnMoreUrl': 'Learn more URL',
      'alertType': 'Type of security alert',
      'actionRequired': 'Required action',
      'contactSupport': 'Support contact information'
    };
    return descriptions[variable] || 'Dynamic content';
  }

  getStatusBadgeClass(template: EmailTemplateMetadata): string {
    return template.isActive 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-gray-100 text-gray-800 border-gray-200';
  }

  getUsageBadgeClass(usageCount: number): string {
    if (usageCount > 100) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (usageCount > 50) return 'bg-green-100 text-green-800 border-green-200';
    if (usageCount > 10) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  }

  getTypeDisplayName(type: NotificationType): string {
    return this.adminNotificationService.getNotificationTypeDisplayName(type);
  }

  get types(): NotificationType[] {
    return this.adminNotificationService.types;
  }
}
