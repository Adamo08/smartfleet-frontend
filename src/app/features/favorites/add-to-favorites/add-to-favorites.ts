import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-add-to-favorites',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './add-to-favorites.html',
  styleUrl: './add-to-favorites.css'
})
export class AddToFavorites {

}
