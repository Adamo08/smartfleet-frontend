import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface Bookmark {
  id: number;
  userId: number;
  vehicleId: number;
  createdAt: Date;
  vehicle?: {
    id: number;
    brand: string;
    model: string;
    year: number;
    imageUrl?: string;
    pricePerDay: number;
  };
}

@Component({
  selector: 'app-bookmarks-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './bookmarks-list.html',
  styleUrl: './bookmarks-list.css'
})
export class BookmarksList implements OnInit {
  bookmarks: Bookmark[] = [];
  loading = false;
  error: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadBookmarks();
  }

  loadBookmarks(): void {
    this.loading = true;
    this.error = null;

    this.http.get<Bookmark[]>(`${environment.apiUrl}/bookmarks`).subscribe({
      next: (data) => {
        this.bookmarks = data;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load bookmarks';
        this.loading = false;
        console.error('Error loading bookmarks:', error);
      }
    });
  }

  removeBookmark(bookmarkId: number): void {
    this.http.delete(`${environment.apiUrl}/bookmarks/${bookmarkId}`).subscribe({
      next: () => {
        this.bookmarks = this.bookmarks.filter(b => b.id !== bookmarkId);
      },
      error: (error) => {
        console.error('Error removing bookmark:', error);
        this.error = 'Failed to remove bookmark';
      }
    });
  }

  getVehicleImageUrl(vehicle: any): string {
    return vehicle?.imageUrl || '/assets/images/icons/car.svg';
  }
}
