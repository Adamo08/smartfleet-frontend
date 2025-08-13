import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-form.html',
  styleUrl: './user-form.css'
})
export class UserForm {

}
