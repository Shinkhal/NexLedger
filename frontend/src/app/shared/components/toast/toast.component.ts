import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  readonly toastService = inject(ToastService);

  getToastClasses(type: Toast['type']): string {
    const base = 'flex items-center gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 pointer-events-auto ';
    switch (type) {
      case 'success':
        return base + 'bg-emerald-50/90 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200';
      case 'error':
        return base + 'bg-rose-50/90 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200';
      case 'warning':
        return base + 'bg-amber-50/90 dark:bg-amber-950/90 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200';
      case 'info':
      default:
        return base + 'bg-blue-50/90 dark:bg-blue-950/90 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200';
    }
  }
}
