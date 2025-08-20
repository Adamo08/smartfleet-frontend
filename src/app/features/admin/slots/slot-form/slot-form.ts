import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { SlotService } from '../../../../core/services/slot.service';

@Component({
  selector: 'app-slot-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './slot-form.html',
  styleUrl: './slot-form.css'
})
export class SlotForm {
  form!: FormGroup;

  constructor(private fb: FormBuilder, private slotService: SlotService) {
    this.form = this.fb.group({
      vehicleId: [null, Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required]
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    const { vehicleId, startTime, endTime } = this.form.value;
    this.slotService.createSlot({
      vehicleId: Number(vehicleId),
      startTime: new Date(startTime as string),
      endTime: new Date(endTime as string)
    }).subscribe();
  }
}
