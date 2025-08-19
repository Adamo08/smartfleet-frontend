import { Injectable } from '@angular/core';
import { ApiService } from './api';
import { Observable, map } from 'rxjs';
import { AuthService } from './auth';

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
  constructor(private apiService: ApiService, private authService: AuthService) {}

  getMyFavorites(params?: any): Observable<Favorite[]> {
    return this.apiService.get<PaginatedResponse<Favorite>>('/favorites/my', params).pipe(
      map(response => response.content)
    );
  }

  getFavoriteById(id: number): Observable<Favorite> {
    return this.apiService.get<Favorite>(`/favorites/${id}`);
  }

  createFavorite(favorite: Partial<Favorite>): Observable<Favorite> {
    const currentUser = this.authService.getCurrentUser();
    const payload = { ...favorite, userId: currentUser?.id };
    return this.apiService.post<Favorite>('/favorites', payload);
  }

  deleteFavorite(id: number): Observable<void> {
    return this.apiService.delete<void>(`/favorites/${id}`);
  }

  addToFavorites(vehicleId: number): Observable<Favorite> {
    const currentUser = this.authService.getCurrentUser();
    return this.apiService.post<Favorite>('/favorites', { userId: currentUser?.id, vehicleId });
  }

  removeFromFavoritesById(favoriteId: number): Observable<void> {
    return this.apiService.delete<void>(`/favorites/${favoriteId}`);
  }

  deleteAllFavorites(): Observable<void> {
    return this.apiService.delete<void>('/favorites/my/all');
  }
}
