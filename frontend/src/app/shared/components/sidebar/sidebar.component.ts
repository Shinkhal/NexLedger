import { Component, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/user.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly isMobileOpen = signal<boolean>(false);
  readonly isDarkMode = signal<boolean>(false);

  constructor() {
    // Sync UI toggle with the root applied theme
    if (typeof window !== 'undefined') {
      const isDark = document.documentElement.classList.contains('dark');
      this.isDarkMode.set(isDark);
    }
  }

  toggleTheme(): void {
    const nextDarkState = !this.isDarkMode();
    this.isDarkMode.set(nextDarkState);
    this.applyTheme(nextDarkState);
    localStorage.setItem('theme', nextDarkState ? 'dark' : 'light');
    this.cdr.markForCheck(); // Notify OnPush change detection
    this.toast.info(`Switched to ${nextDarkState ? 'Dark' : 'Light'} theme`);
  }

  private applyTheme(isDark: boolean): void {
    if (typeof document !== 'undefined') {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }

  toggleMobileMenu(): void {
    this.isMobileOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.isMobileOpen.set(false);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.toast.success('Logged out successfully');
        this.router.navigate(['/login']);
      },
      error: () => {
        this.toast.error('Logout failed, clearing session locally');
        this.router.navigate(['/login']);
      }
    });
  }

  isAdmin(): boolean {
    return this.authService.currentUser()?.role === UserRole.ADMIN;
  }

  getUserRoleLabel(role: UserRole | undefined): string {
    if (!role) return 'Guest';
    switch (role) {
      case UserRole.ADMIN: return 'Administrator';
      case UserRole.ANALYST: return 'Financial Analyst';
      case UserRole.VIEWER: return 'Viewer';
      default: return role;
    }
  }
}
