import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-not-found',
  imports: [FormsModule],
  templateUrl: './not-found.html',
  styleUrl: './not-found.css'
})
export class NotFound {
  searchQuery: string = '';

  constructor(
    private router: Router,
    private location: Location
  ) {}

  goHome(): void {
    this.router.navigate(['/']);
  }

  goBack(): void {
    this.location.back();
  }

  performSearch(): void {
    if (this.searchQuery.trim()) {
      // Navigate to search results or vehicle list with search query
      this.router.navigate(['/vehicles'], { 
        queryParams: { search: this.searchQuery.trim() } 
      });
    }
  }
}
