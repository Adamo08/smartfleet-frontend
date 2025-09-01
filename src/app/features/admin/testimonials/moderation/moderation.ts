import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestimonialService, Testimonial } from '../../../../core/services/testimonial';
import { SkeletonPage } from '../../../../shared/components/skeleton-page/skeleton-page';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { SuccessModalService } from '../../../../shared/services/success-modal.service';
import { Page, Pageable } from '../../../../core/models/pagination.interface';

@Component({
  selector: 'app-moderation',
  standalone: true,
  imports: [CommonModule, SkeletonPage, Pagination],
  templateUrl: './moderation.html',
  styleUrl: './moderation.css'
})
export class Moderation implements OnInit {
  testimonials: Testimonial[] = [];
  isLoading = false;
  
  // Pagination properties
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  testimonialsPage!: Page<Testimonial>;

  constructor(
    private testimonialService: TestimonialService,
    private successModalService: SuccessModalService
  ) {}

  ngOnInit(): void {
    this.loadTestimonials();
  }

  loadTestimonials(): void {
    this.isLoading = true;
    
    const pageable: Pageable = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: 'createdAt',
      sortDirection: 'DESC'
    };
    
    this.testimonialService.getAllTestimonialsPaginated(pageable).subscribe({
      next: (response) => { 
        this.testimonialsPage = response;
        this.testimonials = response.content;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.currentPage = response.number;
        this.isLoading = false;
      },
      error: (error) => { 
        console.error('Error loading testimonials:', error);
        this.isLoading = false; 
      }
    });
  }

  approve(id: number): void {
    const testimonial = this.testimonials.find(t => t.id === id);
    if (!testimonial) return;

    this.testimonialService.approveTestimonial(id).subscribe({
      next: () => {
        // Update local testimonial
        this.testimonials = this.testimonials.map(t => 
          t.id === id ? { ...t, approved: true } : t
        );
        
        // Show success message
        this.successModalService.show({
          title: 'Testimonial Approved!',
          message: `The testimonial by ${testimonial.userName || 'User'} has been successfully approved.`,
          details: `Rating: ${testimonial.rating}/5 | Created: ${new Date(testimonial.createdAt).toLocaleDateString()}`,
          autoClose: true,
          autoCloseDelay: 3000
        });
      },
      error: (error) => {
        console.error('Error approving testimonial:', error);
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadTestimonials();
  }
}
