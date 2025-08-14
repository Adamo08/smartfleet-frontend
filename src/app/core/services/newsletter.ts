import { Injectable } from '@angular/core';
import { ApiService } from './api';
import { Observable } from 'rxjs';

export interface NewsletterSubscription {
  id: number;
  email: string;
  isActive: boolean;
  subscribedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NewsletterService {
  constructor(private apiService: ApiService) {}

  subscribe(email: string): Observable<NewsletterSubscription> {
    return this.apiService.post<NewsletterSubscription>('/newsletter/subscribe', { email });
  }

  unsubscribe(email: string): Observable<void> {
    return this.apiService.post<void>('/newsletter/unsubscribe', { email });
  }

  // For now, we'll use a mock implementation
  subscribeMock(email: string): Observable<NewsletterSubscription> {
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({
          id: Date.now(),
          email: email,
          isActive: true,
          subscribedAt: new Date().toISOString()
        });
        observer.complete();
      }, 1000);
    });
  }
}
