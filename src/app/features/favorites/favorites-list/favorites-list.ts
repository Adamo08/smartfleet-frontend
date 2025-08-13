import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-favorites-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './favorites-list.html',
  styleUrl: './favorites-list.css'
})
export class FavoritesList {

}
