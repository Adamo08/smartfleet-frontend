import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NewsletterService } from '../../../core/services/newsletter';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class Footer {
  newsletterEmail: string = '';
  isSubscribing: boolean = false;
  isLoggedIn: boolean = false;
  isAdmin: boolean = false;

  constructor(
    private newsletterService: NewsletterService,
    private authService: AuthService
  ) {
    this.checkAuthStatus();
  }

  private checkAuthStatus(): void {
    this.isLoggedIn = this.authService.isAuthenticated();
    this.isAdmin = this.authService.isAdmin();
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
