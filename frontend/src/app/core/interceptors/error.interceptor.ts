import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401 && !req.url.includes('/auth/')) {
        router.navigate(['/login']);
        return throwError(() => error);
      }

      if (error.status === 403) {
        toastService.error('You do not have permission to perform this action.');
      } else if (error.status === 404) {
        toastService.error('The requested resource was not found.');
      } else if (error.status === 429) {
        toastService.error('Too many requests. Please try again later.');
      } else if (error.status >= 500) {
        toastService.error('Server error. Please try again later.');
      } else if (error.status === 0) {
        toastService.error('Network error. Please check your connection.');
      } else if (error.error?.message) {
        toastService.error(error.error.message);
      }

      return throwError(() => error);
    })
  );
};
