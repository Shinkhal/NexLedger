import { Injectable, signal } from '@angular/core';
import { Observable, tap, catchError, of, throwError } from 'rxjs';
import { ApiService } from './api.service';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  TokenRefreshResponse,
} from '../models/auth.model';
import { User } from '../models/user.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class AuthService extends ApiService {
  private readonly TOKEN_KEY = 'accessToken';
  private readonly REFRESH_KEY = 'refreshToken';

  // Current authenticated user state as Angular Signal
  readonly currentUser = signal<User | null>(null);
  readonly loadingUser = signal<boolean>(false);

  constructor() {
    super();
  }

  initUser(): Observable<ApiResponse<User> | null> {
    if (this.getAccessToken()) {
      this.loadingUser.set(true);
      return this.fetchProfile().pipe(
        tap((res) => {
          if (res.success && res.data) {
            this.currentUser.set(res.data);
          } else {
            this.clearTokens();
          }
          this.loadingUser.set(false);
        }),
        catchError(() => {
          this.clearTokens();
          this.loadingUser.set(false);
          return of(null);
        })
      );
    }
    return of(null);
  }

  fetchProfile(): Observable<ApiResponse<User>> {
    return this.get<User>('/me');
  }

  login(credentials: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.post<AuthResponse>('/auth/login', credentials).pipe(
      tap((res) => {
        if (res.data) {
          localStorage.setItem(this.TOKEN_KEY, res.data.accessToken);
          localStorage.setItem(this.REFRESH_KEY, res.data.refreshToken);
          localStorage.setItem('userRole', res.data.user.role);
          this.currentUser.set(res.data.user);
        }
      })
    );
  }

  register(data: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    return this.post<AuthResponse>('/auth/register', data);
  }

  forgotPassword(email: string): Observable<ApiResponse<null>> {
    return this.post<null>('/auth/forgot-password', { email });
  }

  logout(): Observable<ApiResponse<null>> {
    return this.post<null>('/auth/logout').pipe(
      tap(() => {
        this.clearTokens();
        this.currentUser.set(null);
      }),
      catchError((err) => {
        this.clearTokens();
        this.currentUser.set(null);
        return throwError(() => err);
      })
    );
  }

  refreshToken(): Observable<ApiResponse<TokenRefreshResponse>> {
    const refreshToken = localStorage.getItem(this.REFRESH_KEY);
    return this.post<TokenRefreshResponse>('/auth/refresh', { refreshToken }).pipe(
      tap((res) => {
        if (res.data?.accessToken) {
          localStorage.setItem(this.TOKEN_KEY, res.data.accessToken);
        }
      })
    );
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem('userRole');
  }
}
