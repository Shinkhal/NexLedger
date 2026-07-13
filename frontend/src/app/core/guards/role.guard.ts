import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUser = authService.currentUser();
  const userRole = currentUser?.role || (localStorage.getItem('userRole') as UserRole);
  const requiredRoles = route.data['roles'] as UserRole[];

  if (!userRole || !requiredRoles.includes(userRole)) {
    // If not authorized, redirect to dashboard
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
