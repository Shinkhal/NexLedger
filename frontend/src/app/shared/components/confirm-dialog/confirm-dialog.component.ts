import { Component, Injectable, signal, inject, ChangeDetectionStrategy } from '@angular/core';

export interface ConfirmDialogConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  readonly isOpen = signal<boolean>(false);
  readonly config = signal<ConfirmDialogConfig>({
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'danger',
  });

  private resolvePromise: ((value: boolean) => void) | null = null;

  confirm(config: ConfirmDialogConfig): Promise<boolean> {
    this.config.set({
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      type: 'danger',
      ...config,
    });
    this.isOpen.set(true);

    return new Promise<boolean>((resolve) => {
      this.resolvePromise = resolve;
    });
  }

  accept(): void {
    this.isOpen.set(false);
    this.resolvePromise?.(true);
    this.resolvePromise = null;
  }

  decline(): void {
    this.isOpen.set(false);
    this.resolvePromise?.(false);
    this.resolvePromise = null;
  }
}

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  readonly dialogService = inject(ConfirmDialogService);

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('confirm-backdrop')) {
      this.dialogService.decline();
    }
  }
}
