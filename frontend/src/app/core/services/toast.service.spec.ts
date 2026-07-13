import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty toasts', () => {
    expect(service.toasts()).toEqual([]);
  });

  it('should add a toast', () => {
    service.show('success', 'Test message');
    const toasts = service.toasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].message).toBe('Test message');
    expect(toasts[0].type).toBe('success');
  });

  it('should add multiple toasts', () => {
    service.success('Success');
    service.error('Error');
    expect(service.toasts().length).toBe(2);
  });

  it('should remove a toast by id', () => {
    service.show('info', 'Test');
    const id = service.toasts()[0].id;
    service.remove(id);
    expect(service.toasts().length).toBe(0);
  });

  it('should auto-remove toast after duration', async () => {
    service.show('warning', 'Auto-remove', 100);
    await new Promise((r) => setTimeout(r, 150));
    expect(service.toasts().length).toBe(0);
  });
});
