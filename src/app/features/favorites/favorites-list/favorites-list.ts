import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FavoriteService, Favorite } from '../../../core/services/favorite';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-favorites-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './favorites-list.html',
  styleUrl: './favorites-list.css'
})
export class FavoritesList implements OnInit {
  favorites: Favorite[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private favoriteService: FavoriteService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadFavorites();
  }

  loadFavorites(): void {
    this.loading = true;
    this.favoriteService.getMyFavorites().subscribe({
      next: (favorites) => {
        this.favorites = favorites;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load favorites';
        this.loading = false;
        console.error(err);
      }
    });
  }

  removeFavorite(favoriteId: number): void {
    const favorite = this.favorites.find(f => f.id === favoriteId);
    const vehicleName = favorite ? `${favorite.vehicleBrand} ${favorite.vehicleModel}` : 'Vehicle';
    
    this.favoriteService.deleteFavorite(favoriteId).subscribe({
      next: () => {
        this.favorites = this.favorites.filter(f => f.id !== favoriteId);
        this.toastr.success(`${vehicleName} removed from favorites`, 'Favorite Removed');
      },
      error: (err) => {
        console.error('Failed to remove favorite', err);
        this.toastr.error('Failed to remove favorite', 'Error');
      }
    });
  }

  removeAllFavorites(): void {
    if (confirm('Are you sure you want to remove all favorites?')) {
      this.favoriteService.deleteAllFavorites().subscribe({
        next: () => {
          this.favorites = [];
          this.toastr.success('All favorites removed', 'Favorites Cleared');
        },
        error: (err) => {
          console.error('Failed to remove all favorites', err);
          this.error = 'Failed to remove all favorites';
          this.toastr.error('Failed to remove all favorites', 'Error');
        }
      });
    }
  }
}
