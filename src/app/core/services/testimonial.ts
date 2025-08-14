import { Injectable } from '@angular/core';
import { ApiService } from './api';
import { Observable, map } from 'rxjs';

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

interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class TestimonialService {
  constructor(private apiService: ApiService) {}

  getPublicTestimonials(params?: any): Observable<Testimonial[]> {
    return this.apiService.get<PaginatedResponse<Testimonial>>('/testimonials/public', params).pipe(
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
    return this.apiService.get<PaginatedResponse<Testimonial>>('/testimonials/my', params).pipe(
      map(response => response.content)
    );
  }
}
