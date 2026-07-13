import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with null user', () => {
    expect(service.currentUser()).toBeNull();
  });

  it('should handle login successfully', () => {
    const mockResponse = {
      success: true,
      data: {
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh',
        user: { id: 1, name: 'Test', email: 'test@example.com', role: 'VIEWER' },
      },
    };

    service.login({ email: 'test@example.com', password: 'password' }).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.data?.accessToken).toBe('mock-token');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should store tokens on login', () => {
    const mockResponse = {
      success: true,
      data: {
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh',
        user: { id: 1, name: 'Test', email: 'test@example.com', role: 'VIEWER' },
      },
    };

    service.login({ email: 'test@example.com', password: 'password' }).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush(mockResponse);

    expect(service.getAccessToken()).toBe('mock-token');
    expect(service.currentUser()).toBeTruthy();
  });

  it('should clear tokens on logout', () => {
    localStorage.setItem('accessToken', 'test-token');
    localStorage.setItem('refreshToken', 'test-refresh');

    service.logout().subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
    req.flush({ success: true, data: null });

    expect(service.getAccessToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
  });

  it('should clear tokens even if logout API fails', () => {
    localStorage.setItem('accessToken', 'test-token');
    localStorage.setItem('refreshToken', 'test-refresh');

    service.logout().subscribe({
      error: () => {
        expect(service.getAccessToken()).toBeNull();
      },
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
    req.flush({ message: 'Server error' }, { status: 500, statusText: 'Server Error' });
  });
});
