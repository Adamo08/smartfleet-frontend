import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BookmarkDto, CreateBookmarkRequest, BookmarkFilter, BookmarkPageRequest } from '../models/bookmark.interface';
import { Page } from '../models/pagination.interface';
import { map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class BookmarkService {
  private readonly baseUrl = `${environment.apiUrl}/bookmarks`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Create a new bookmark
  createBookmark(request: CreateBookmarkRequest): Observable<BookmarkDto> {
    const currentUser = this.authService.getCurrentUser();
    const payload = {
      userId: currentUser?.id,
      reservationId: request.reservationId
    };
    return this.http.post<BookmarkDto>(this.baseUrl, payload);
  }

  // Get bookmark by ID
  getBookmarkById(id: number): Observable<BookmarkDto> {
    return this.http.get<BookmarkDto>(`${this.baseUrl}/${id}`);
  }

  // Delete bookmark
  deleteBookmark(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // Get all bookmarks with pagination and filters
  getAllBookmarks(request: BookmarkPageRequest): Observable<Page<BookmarkDto>> {
    let params = new HttpParams()
      .set('page', request.page.toString())
      .set('size', request.size.toString());

    if (request.sortBy) {
      params = params.set('sortBy', request.sortBy);
    }
    if (request.sortDirection) {
      params = params.set('sortDirection', request.sortDirection);
    }
    if (request.userId) {
      params = params.set('userId', request.userId.toString());
    }

    return this.http.get<Page<BookmarkDto>>(this.baseUrl, { params });
  }

  // Get current user's bookmarks
  getMyBookmarks(page: number = 0, size: number = 10, sortBy: string = 'createdAt', sortDirection: 'ASC' | 'DESC' = 'DESC'): Observable<Page<BookmarkDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);

    return this.http.get<Page<BookmarkDto>>(`${this.baseUrl}/my`, { params });
  }

  // Check if a reservation is bookmarked by current user
  isReservationBookmarked(reservationId: number): Observable<boolean> {
    return this.getMyBookmarks(0, 50).pipe(
      map(page => page.content.some(b => b.reservationId === reservationId))
    );
  }

  // Toggle bookmark (create if not exists, delete if exists)
  toggleBookmark(reservationId: number): Observable<BookmarkDto | void> {
    return this.isReservationBookmarked(reservationId).pipe(
      switchMap(isBookmarked => {
        if (isBookmarked) {
          return this.getMyBookmarks(0, 50).pipe(
            switchMap(page => {
              const found = page.content.find(b => b.reservationId === reservationId);
              if (found) {
                return this.deleteBookmark(found.id);
              }
              return of(void 0);
            })
          );
        } else {
          return this.createBookmark({ reservationId });
        }
      })
    );
  }

  // Get bookmark count for a user
  getBookmarkCount(userId?: number): Observable<number> {
    const params = userId ? new HttpParams().set('userId', userId.toString()) : new HttpParams();
    return this.http.get<Page<BookmarkDto>>(`${this.baseUrl}?size=1`, { params }).pipe(
      map(page => page.totalElements)
    );
  }
}
