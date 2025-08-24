import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BookmarkService } from '../../../core/services/bookmark.service';
import { Page, Pageable } from '../../../core/models/pagination.interface';
import { BookmarkDto } from '../../../core/models/bookmark.interface';
import { Pagination } from '../../../shared/components/pagination/pagination';

type Bookmark = BookmarkDto;

@Component({
  selector: 'app-bookmarks-list',
  standalone: true,
  imports: [CommonModule, RouterModule, Pagination],
  templateUrl: './bookmarks-list.html',
  styleUrl: './bookmarks-list.css'
})
export class BookmarksList implements OnInit {
  bookmarksPage!: Page<Bookmark>;
  loading = false;
  error: string | null = null;
  currentPage = 0;
  pageSize = 10;
  sortBy = 'createdAt';
  sortDirection: 'ASC' | 'DESC' = 'DESC';

  constructor(private bookmarkService: BookmarkService) {}

  ngOnInit(): void {
    this.loadBookmarks();
  }

  loadBookmarks(): void {
    this.loading = true;
    this.error = null;

    const pageable: Pageable = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };

    this.bookmarkService.getMyBookmarks(
      pageable.page, 
      pageable.size, 
      pageable.sortBy, 
      pageable.sortDirection
    ).subscribe({
      next: (page: Page<Bookmark>) => {
        this.bookmarksPage = page;
        this.currentPage = page.number;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load bookmarks';
        this.loading = false;
        console.error('Error loading bookmarks:', error);
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadBookmarks();
  }

  removeBookmark(bookmarkId: number): void {
    this.bookmarkService.deleteBookmark(bookmarkId).subscribe({
      next: () => {
        this.bookmarksPage.content = this.bookmarksPage.content.filter(b => b.id !== bookmarkId);
        this.bookmarksPage.totalElements--;
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
