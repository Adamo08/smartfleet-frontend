import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css'
})
export class Pagination {
  @Input() currentPage: number = 0;
  @Input() totalPages: number = 0;
  @Output() pageChange = new EventEmitter<number>();

  private readonly pageRangeDisplayed: number = 2; // Number of pages to show around the current page
  private isMobile: boolean = false;

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  ngOnInit() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth < 768; // md breakpoint
  }

  get pageRangeDisplayedResponsive(): number {
    return this.isMobile ? 1 : this.pageRangeDisplayed;
  }

  get pages(): (number | string)[] {
    const pages: (number | string)[] = [];
    const range = this.pageRangeDisplayedResponsive;

    if (this.totalPages <= 1) {
      return [];
    }

    // For mobile, show fewer pages
    if (this.isMobile) {
      // On mobile, show current page and adjacent pages only
      if (this.totalPages <= 3) {
        // Show all pages if 3 or fewer
        for (let i = 0; i < this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show first page, current page area, and last page
        pages.push(0);
        
        if (this.currentPage > 1) {
          pages.push('...');
        }
        
        // Show current page and adjacent pages
        const start = Math.max(1, this.currentPage - range);
        const end = Math.min(this.totalPages - 2, this.currentPage + range);
        
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
        
        if (this.currentPage < this.totalPages - 2) {
          pages.push('...');
        }
        
        pages.push(this.totalPages - 1);
      }
    } else {
      // Desktop behavior (original logic)
      // Always show the first page
      pages.push(0);

      // Calculate start and end for the central block of pages
      let startPage = Math.max(1, this.currentPage - range);
      let endPage = Math.min(this.totalPages - 2, this.currentPage + range);

      // Adjust start and end if they overlap with the first/last page or each other
      if (this.currentPage - range < 1 && this.totalPages > 1) {
        endPage = Math.min(this.totalPages - 2, range * 2);
      }
      if (this.currentPage + range > this.totalPages - 2 && this.totalPages > 1) {
        startPage = Math.max(1, this.totalPages - 1 - (range * 2));
      }

      // Add ellipsis after the first page if necessary
      if (startPage > 1) {
        pages.push('...');
      }

      // Add the central block of pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Add ellipsis before the last page if necessary
      if (endPage < this.totalPages - 2) {
        pages.push('...');
      }

      // Always show the last page (if more than one page exists and it's not the first page)
      if (this.totalPages > 1 && !pages.includes(this.totalPages - 1)) {
        pages.push(this.totalPages - 1);
      }
    }

    // Filter out duplicate ellipses and ensure unique numbers
    const uniquePages = Array.from(new Set(pages));
    return uniquePages.sort((a, b) => {
      if (a === '...') return 1; // Always push ellipsis to the end for sorting purposes initially
      if (b === '...') return -1;
      return (a as number) - (b as number);
    });
  }

  goToPage(page: number | string): void {
    if (typeof page === 'number') {
      if (page >= 0 && page < this.totalPages) {
        this.pageChange.emit(page);
      }
    }
  }

  // Helper method to display page numbers (1-based)
  getDisplayPage(page: number | string): number | string {
    return typeof page === 'number' ? page + 1 : page;
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }
}
