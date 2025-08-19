import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BookmarkService } from '../../../core/services/bookmark.service';
import { Page } from '../../../core/models/pagination.interface';
import { BookmarkDto } from '../../../core/models/bookmark.interface';

type Bookmark = BookmarkDto;

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

  constructor(private bookmarkService: BookmarkService) {}

  ngOnInit(): void {
    this.loadBookmarks();
  }

  loadBookmarks(): void {
    this.loading = true;
    this.error = null;

    this.bookmarkService.getMyBookmarks(0, 50).subscribe({
      next: (page: Page<Bookmark>) => {
        this.bookmarks = page.content;
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
    this.bookmarkService.deleteBookmark(bookmarkId).subscribe({
      next: () => {
        this.bookmarks = this.bookmarks.filter(b => b.id !== bookmarkId);
      },
      error: (error) => {
        console.error('Error removing bookmark:', error);
        this.error = 'Failed to remove bookmark';
      }
    });
  }

  getVehicleImageUrl(vehicleId?: number): string {
    return '/assets/images/icons/car.svg';
  }
}
