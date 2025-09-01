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
  @Output() cancelled = new EventEmitter<void>();
  @Output() userAdded = new EventEmitter<void>();
  @Output() userUpdated = new EventEmitter<void>();

  form!: FormGroup;
  editMode = false;
  isSubmitting = false;

  constructor(private fb: FormBuilder, private api: ApiService) {}

  ngOnInit(): void {
    this.editMode = !!this.user;
    this.form = this.fb.group({
      firstName: [this.user?.firstName || '', [Validators.required]],
      lastName: [this.user?.lastName || '', [Validators.required]],
      email: [this.user?.email || '', [Validators.required, Validators.email]],
      phoneNumber: [this.user?.phoneNumber || '', this.editMode ? [] : [Validators.required, Validators.pattern(/^0[7|6][0-9]{8}$/)]],
      role: [this.user?.role || '', this.editMode ? [Validators.required] : []],
      password: ['', this.editMode ? [] : [Validators.required, Validators.minLength(6), Validators.maxLength(25)]]
    });

    if (this.editMode) {
      this.form.get('email')?.disable(); // Email should not be editable for existing users
    }
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting) return;

    this.isSubmitting = true;
    const formData = { ...this.form.value };
    
    // Re-enable email for submission if it was disabled
    if (this.editMode && this.form.get('email')?.disabled) {
      formData.email = this.user?.email;
    }

    if (this.editMode) {
      // Handle update logic here
      this.api.put(`/users/${this.user!.id}`, formData).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.userUpdated.emit();
          this.formSubmitted.emit();
        },
        error: (err) => {
          console.error('Error updating user:', err);
          this.isSubmitting = false;
        }
      });
    } else {
      // Handle create logic here - exclude role for new users (backend sets default)
      const createRequest = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password
      };
      
      this.api.post('/users', createRequest).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.userAdded.emit();
          this.formSubmitted.emit();
          this.resetForm();
        },
        error: (err) => {
          console.error('Error creating user:', err);
          this.isSubmitting = false;
        }
      });
    }
  }

  cancel(): void {
    this.cancelled.emit();
  }

  resetForm(): void {
    this.form.reset();
    this.form.get('email')?.enable(); // Re-enable for new user form
    this.editMode = false;
    this.isSubmitting = false;
  }
}
