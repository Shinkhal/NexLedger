import { Component, inject, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { UserRole } from '../../core/models/user.model';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly currentUser = this.authService.currentUser;

  readonly profileForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phoneNumber: ['', [Validators.pattern('^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\\s\\./0-9]*$')]],
  });

  readonly passwordForm: FormGroup = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  }, {
    validators: this.passwordMatchValidator
  });

  // State Signals
  readonly loadingProfile = signal<boolean>(false);
  readonly loadingPassword = signal<boolean>(false);
  readonly activeSubTab = signal<'personal' | 'security' | 'sessions'>('personal');
  readonly selectedAvatar = signal<string>('avatar-1');
  readonly showCurrentPass = signal<boolean>(false);
  readonly showNewPass = signal<boolean>(false);
  readonly showConfirmPass = signal<boolean>(false);

  // Dynamic user agent parsing for active device
  readonly currentDevice = computed(() => {
    if (typeof window === 'undefined') return 'Unknown Device';
    const ua = window.navigator.userAgent;
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';

    if (ua.indexOf('Win') !== -1) os = 'Windows';
    else if (ua.indexOf('Mac') !== -1) os = 'macOS';
    else if (ua.indexOf('X11') !== -1) os = 'UNIX';
    else if (ua.indexOf('Linux') !== -1) os = 'Linux';
    else if (ua.indexOf('Android') !== -1) os = 'Android';
    else if (ua.indexOf('like Mac') !== -1) os = 'iOS';

    if (ua.indexOf('Firefox') !== -1) browser = 'Mozilla Firefox';
    else if (ua.indexOf('SamsungBrowser') !== -1) browser = 'Samsung Internet';
    else if (ua.indexOf('Opera') !== -1 || ua.indexOf('OPR') !== -1) browser = 'Opera';
    else if (ua.indexOf('Trident') !== -1) browser = 'Internet Explorer';
    else if (ua.indexOf('Edge') !== -1) browser = 'Microsoft Edge';
    else if (ua.indexOf('Chrome') !== -1) browser = 'Google Chrome';
    else if (ua.indexOf('Safari') !== -1) browser = 'Apple Safari';

    return `${browser} on ${os}`;
  });

  // Dynamic password strength meter
  readonly passwordStrength = computed(() => {
    const pass = this.passwordForm.get('newPassword')?.value || '';
    if (!pass) return { score: 0, label: 'None', colorClass: 'bg-slate-200 dark:bg-slate-800' };
    
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    switch (score) {
      case 1: return { score: 25, label: 'Weak Strength', colorClass: 'bg-rose-500 w-1/4' };
      case 2: return { score: 50, label: 'Fair Strength', colorClass: 'bg-amber-500 w-2/4' };
      case 3: return { score: 75, label: 'Good Strength', colorClass: 'bg-indigo-500 w-3/4' };
      case 4: return { score: 100, label: 'Strong Strength', colorClass: 'bg-emerald-500 w-full' };
      default: return { score: 0, label: 'None', colorClass: 'bg-slate-200 dark:bg-slate-800 w-0' };
    }
  });

  constructor() {
    // Sync forms and signals with authenticated user profile
    effect(() => {
      const user = this.currentUser();
      if (user) {
        this.profileForm.patchValue({
          name: user.name,
          phoneNumber: user.phoneNumber || '',
        });
        this.selectedAvatar.set(user.avatar || 'avatar-1');
      }
    });
  }

  private passwordMatchValidator(form: FormGroup): Record<string, boolean> | null {
    const newPass = form.get('newPassword')?.value;
    const confirmPass = form.get('confirmPassword')?.value;
    return newPass && confirmPass && newPass !== confirmPass ? { passwordMismatch: true } : null;
  }

  onUpdateProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.loadingProfile.set(true);
    this.userService.updateProfile({
      name: this.profileForm.value.name,
      phoneNumber: this.profileForm.value.phoneNumber,
      avatar: this.selectedAvatar()
    }).subscribe({
      next: (res) => {
        this.loadingProfile.set(false);
        if (res.success && res.data) {
          this.toast.success('Profile details modified successfully');
          this.authService.currentUser.set(res.data);
        }
      },
      error: (err) => {
        this.loadingProfile.set(false);
        this.toast.error(err.error?.error?.message || 'Failed to update profile details');
      }
    });
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.loadingPassword.set(true);
    const { currentPassword, newPassword } = this.passwordForm.value;
    
    this.userService.changePassword({ currentPassword, newPassword }).subscribe({
      next: (res) => {
        this.loadingPassword.set(false);
        if (res.success) {
          this.toast.success('Password changed successfully');
          this.passwordForm.reset();
          this.toast.info('Please re-authenticate with your new password on next login.');
        }
      },
      error: (err) => {
        this.loadingPassword.set(false);
        const errMsg = err.error?.error?.message || 'Failed to change password. Make sure current password is correct.';
        this.toast.error(errMsg);
      }
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.toast.success('Logged out successfully');
        this.router.navigate(['/login']);
      },
      error: () => {
        this.toast.success('Logged out successfully');
        this.router.navigate(['/login']);
      }
    });
  }

  getRoleLabel(role: UserRole | undefined): string {
    if (!role) return '';
    switch (role) {
      case UserRole.ADMIN: return 'Administrator';
      case UserRole.ANALYST: return 'Financial Analyst';
      case UserRole.VIEWER: return 'Viewer';
      default: return role;
    }
  }
}
