import { Component } from '@angular/core';
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

}
