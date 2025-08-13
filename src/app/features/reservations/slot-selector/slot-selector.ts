import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-slot-selector',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './slot-selector.html',
  styleUrl: './slot-selector.css'
})
export class SlotSelector {

}
