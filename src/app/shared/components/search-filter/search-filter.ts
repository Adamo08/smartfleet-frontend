import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-search-filter',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './search-filter.html',
  styleUrl: './search-filter.css'
})
export class SearchFilter {

}
