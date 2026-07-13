import { Component, input, output, ChangeDetectionStrategy, HostListener } from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly title = input<string>('');
  readonly size = input<'sm' | 'md' | 'lg' | 'xl'>('md');
  readonly hasFooter = input<boolean>(false);

  readonly dismiss = output<void>();

  onBackdropClick(event: MouseEvent): void {
    // Only close if clicking the backdrop itself
    if ((event.target as HTMLElement).classList.contains('backdrop-overlay')) {
      this.dismiss.emit();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (this.isOpen()) {
      this.dismiss.emit();
    }
  }

  getSizeClass(): string {
    switch (this.size()) {
      case 'sm': return 'max-w-md';
      case 'lg': return 'max-w-2xl';
      case 'xl': return 'max-w-4xl';
      case 'md':
      default:
        return 'max-w-lg';
    }
  }
}
