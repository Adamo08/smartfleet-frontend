import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NewsletterService } from '../../../core/services/newsletter';
import { AuthService } from '../../../core/services/auth';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class Footer implements OnInit, OnDestroy {
  newsletterEmail: string = '';
  isSubscribing: boolean = false;
  isLoggedIn: boolean = false;
  isAdmin: boolean = false;
  private authSubscription!: Subscription;

  constructor(
    private newsletterService: NewsletterService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Subscribe to the currentUser$ observable to react to authentication state changes
    this.authSubscription = this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.isAdmin = !!user && user.role === 'ADMIN';
    });
  }

  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  subscribeNewsletter() {
    if (this.newsletterEmail && this.newsletterEmail.trim()) {
      this.isSubscribing = true;
      this.newsletterService.subscribeMock(this.newsletterEmail).subscribe({
        next: (subscription) => {
          console.log('Newsletter subscription successful:', subscription);
          alert('Thank you for subscribing to our newsletter!');
          this.newsletterEmail = '';
          this.isSubscribing = false;
        },
        error: (error) => {
          console.error('Newsletter subscription failed:', error);
          alert('Failed to subscribe. Please try again.');
          this.isSubscribing = false;
        }
      });
    } else {
      alert('Please enter a valid email address.');
    }
  }
}
