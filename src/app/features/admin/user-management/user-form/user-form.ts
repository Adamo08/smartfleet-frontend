import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ApiService } from '../../../../core/services/api';
import { User } from '../../../../core/models/user.interface';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './user-form.html',
  styleUrl: './user-form.css'
})
export class UserForm implements OnInit {
  @Input() user: User | null = null;
  @Output() formSubmitted = new EventEmitter<void>();

  form!: FormGroup;
  editMode = false;

  constructor(private fb: FormBuilder, private api: ApiService) {}

  ngOnInit(): void {
    this.editMode = !!this.user;
    this.form = this.fb.group({
      email: [this.user ? this.user.email : '', [Validators.required, Validators.email]],
      firstName: [this.user ? this.user.firstName : '', Validators.required],
      lastName: [this.user ? this.user.lastName : '', Validators.required],
      // Password is only required for new users
      password: ['', this.editMode ? [] : [Validators.required]]
    });

    if (this.editMode) {
      this.form.get('email')?.disable(); // Email should not be editable for existing users
    }
  }

  submit(): void {
    if (this.form.invalid) return;

    if (this.editMode) {
      // Handle update logic here
      this.api.put(`/users/${this.user!.id}`, this.form.value).subscribe({
        next: () => this.formSubmitted.emit(),
        error: (err) => console.error('Error updating user:', err)
      });
    } else {
      // Handle create logic here
      this.api.post('/users', this.form.value).subscribe({
        next: () => {
          this.formSubmitted.emit();
          this.resetForm();
        },
        error: (err) => console.error('Error creating user:', err)
      });
    }
  }

  resetForm(): void {
    this.form.reset();
    this.form.get('email')?.enable(); // Re-enable for new user form
    this.editMode = false;
  }
}
