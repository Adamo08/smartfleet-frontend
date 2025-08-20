import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SlotService } from '../../../../core/services/slot.service';
import { Page } from '../../../../core/models/pagination.interface';
import { SlotDto } from '../../../../core/models/slot.interface';

@Component({
  selector: 'app-slot-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './slot-list.html',
  styleUrl: './slot-list.css'
})
export class SlotList implements OnInit {
  slots: SlotDto[] = [];
  page = 0;
  size = 10;
  totalElements = 0;
  isLoading = false;

  constructor(private slotService: SlotService) {}

  ngOnInit(): void { this.load(); }

  load(page: number = this.page): void {
    this.isLoading = true;
    this.slotService.getAllSlots(page, this.size).subscribe({
      next: (res: Page<SlotDto>) => {
        this.slots = res.content;
        this.totalElements = res.totalElements;
        this.page = res.number;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }
}
