import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestimonialService, Testimonial } from '../../../../core/services/testimonial';

@Component({
  selector: 'app-moderation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './moderation.html',
  styleUrl: './moderation.css'
})
export class Moderation implements OnInit {
  testimonials: Testimonial[] = [];
  isLoading = false;

  constructor(private testimonialService: TestimonialService) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.testimonialService.getAllTestimonials({ page: 0, size: 20 }).subscribe({
      next: (res) => { this.testimonials = res; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  approve(id: number): void {
    this.testimonialService.approveTestimonial(id).subscribe(() => {
      this.testimonials = this.testimonials.map(t => t.id === id ? { ...t, approved: true } : t);
    });
  }
}
