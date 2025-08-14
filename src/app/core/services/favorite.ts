import { Injectable } from '@angular/core';
import { ApiService } from './api';
import { Observable, map } from 'rxjs';

export interface Favorite {
  id: number;
  userId: number;
  vehicleId: number;
  createdAt: string;
  updatedAt: string;
  
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
export class FavoriteService {
  constructor(private apiService: ApiService) {}

  getMyFavorites(params?: any): Observable<Favorite[]> {
    return this.apiService.get<PaginatedResponse<Favorite>>('/favorites/my', params).pipe(
      map(response => response.content)
    );
  }

  getFavoriteById(id: number): Observable<Favorite> {
    return this.apiService.get<Favorite>(`/favorites/${id}`);
  }

  createFavorite(favorite: Partial<Favorite>): Observable<Favorite> {
    return this.apiService.post<Favorite>('/favorites', favorite);
  }

  deleteFavorite(id: number): Observable<void> {
    return this.apiService.delete<void>(`/favorites/${id}`);
  }

  addToFavorites(vehicleId: number): Observable<Favorite> {
    return this.apiService.post<Favorite>('/favorites', { vehicleId });
  }

  removeFromFavorites(vehicleId: number): Observable<void> {
    // This would need to be implemented based on how the backend handles it
    // For now, we'll need to get the favorite ID first
    return this.apiService.delete<void>(`/favorites/${vehicleId}`);
  }
}
