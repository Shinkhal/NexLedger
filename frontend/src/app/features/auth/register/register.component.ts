import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly registerForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  readonly loading = signal<boolean>(false);
  readonly showPassword = signal<boolean>(false);

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  hasUppercase(): boolean {
    const pw = this.registerForm.get('password')?.value || '';
    return /[A-Z]/.test(pw);
  }

  hasNumber(): boolean {
    const pw = this.registerForm.get('password')?.value || '';
    return /[0-9]/.test(pw);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    // Self-signup always creates a VIEWER account
    const payload = {
      ...this.registerForm.value,
      role: 'VIEWER',
    };
    this.authService.register(payload).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.toast.success('Registration successful! Please log in.');
          this.router.navigate(['/login']);
        } else {
          this.toast.error(res.message || 'Registration failed');
        }
      },
      error: (err) => {
        this.loading.set(false);
        const errMsg = err.error?.error?.message || 'Email already exists or invalid registration';
        this.toast.error(errMsg);
      },
    });
  }
}
