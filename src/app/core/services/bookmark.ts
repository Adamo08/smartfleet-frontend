import { Injectable } from '@angular/core';
import { ApiService } from './api';
import { Observable, map } from 'rxjs';

export interface Bookmark {
  id: number;
  userId: number;
  reservationId: number;
  createdAt: string;
  updatedAt: string;
  
  // Enriched fields
  userName?: string;
  userEmail?: string;
  reservationStartDate?: string;
  reservationEndDate?: string;
  reservationStatus?: string;
  vehicleId?: number;
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
export class BookmarkService {
  constructor(private apiService: ApiService) {}

  getMyBookmarks(params?: any): Observable<Bookmark[]> {
    return this.apiService.get<PaginatedResponse<Bookmark>>('/bookmarks/my', params).pipe(
      map(response => response.content)
    );
  }

  getBookmarkById(id: number): Observable<Bookmark> {
    return this.apiService.get<Bookmark>(`/bookmarks/${id}`);
  }

  createBookmark(bookmark: Partial<Bookmark>): Observable<Bookmark> {
    return this.apiService.post<Bookmark>('/bookmarks', bookmark);
  }

  deleteBookmark(id: number): Observable<void> {
    return this.apiService.delete<void>(`/bookmarks/${id}`);
  }
}
