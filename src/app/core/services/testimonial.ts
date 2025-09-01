import { Injectable } from '@angular/core';
import { ApiService } from './api';
import { Observable, map } from 'rxjs';
import { Page, Pageable } from '../models/pagination.interface';

export interface Testimonial {
  id: number;
  userId: number;
  vehicleId?: number;
  title: string;
  content: string;
  rating: number;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
  adminReplyContent?: string;
  
  // Enriched fields
  userName?: string;
  userEmail?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
}



@Injectable({
  providedIn: 'root'
})
export class TestimonialService {
  constructor(private apiService: ApiService) {}

  getPublicTestimonials(params?: any): Observable<Testimonial[]> {
    return this.apiService.get<Page<Testimonial>>('/testimonials/public', params).pipe(
      map(response => response.content)
    );
  }

  getTestimonialById(id: number): Observable<Testimonial> {
    return this.apiService.get<Testimonial>(`/testimonials/${id}`);
  }

  createTestimonial(testimonial: Partial<Testimonial>): Observable<Testimonial> {
    return this.apiService.post<Testimonial>('/testimonials', testimonial);
  }

  updateTestimonial(id: number, testimonial: Partial<Testimonial>): Observable<Testimonial> {
    return this.apiService.put<Testimonial>(`/testimonials/${id}`, testimonial);
  }

  deleteTestimonial(id: number): Observable<void> {
    return this.apiService.delete<void>(`/testimonials/${id}`);
  }

  getMyTestimonials(params?: any): Observable<Testimonial[]> {
    return this.apiService.get<Page<Testimonial>>('/testimonials/my', params).pipe(
      map(response => response.content)
    );
  }

  // ADMIN: list all testimonials
  getAllTestimonials(params?: any): Observable<Testimonial[]> {
    return this.apiService.get<Page<Testimonial>>('/testimonials', params).pipe(
      map(response => response.content)
    );
  }

  // ADMIN: list all testimonials with pagination
  getAllTestimonialsPaginated(pageable: Pageable): Observable<Page<Testimonial>> {
    const params = {
      page: pageable.page,
      size: pageable.size,
      sort: pageable.sortBy ? `${pageable.sortBy},${pageable.sortDirection || 'DESC'}` : 'createdAt,DESC'
    };
    return this.apiService.get<Page<Testimonial>>('/admin/testimonials', params);
  }

  // ADMIN: approve testimonial
  approveTestimonial(id: number): Observable<Testimonial> {
    return this.apiService.put<Testimonial>(`/testimonials/${id}/approve`, {});
  }
}
