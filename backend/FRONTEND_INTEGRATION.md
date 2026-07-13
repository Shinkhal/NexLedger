# Angular Frontend Integration Guide

## Table of Contents

- [Setup & Configuration](#setup--configuration)
- [TypeScript Interfaces](#typescript-interfaces)
- [API Client Setup](#api-client-setup)
- [Authentication Flow](#authentication-flow)
- [API Endpoints Reference](#api-endpoints-reference)
- [Role-Based UI Patterns](#role-based-ui-patterns)
- [Error Handling](#error-handling)

---

## Setup & Configuration

### 1. Environment Variables (`src/environments/environment.ts`)

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api',
};
```

### 2. CORS

The backend accepts requests from any origin (`CORS_ORIGIN="*"`). No proxy config needed.

---

## TypeScript Interfaces

Copy these into `src/app/models/`:

### `auth.model.ts`

```ts
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;        // min 8 chars
  name: string;            // min 2 chars
  role?: UserRole;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

export interface TokenRefreshResponse {
  accessToken: string;
}
```

### `user.model.ts`

```ts
export enum UserRole {
  VIEWER = 'VIEWER',
  ANALYST = 'ANALYST',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  phoneNumber?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phoneNumber?: string;
  avatar?: string;
}
```

### `record.model.ts`

```ts
export enum RecordType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum RecordCategory {
  // Income
  SALARY = 'SALARY',
  FREELANCE = 'FREELANCE',
  INVESTMENT = 'INVESTMENT',
  BUSINESS = 'BUSINESS',
  GIFT = 'GIFT',
  OTHER_INCOME = 'OTHER_INCOME',
  // Expense
  HOUSING = 'HOUSING',
  UTILITIES = 'UTILITIES',
  GROCERIES = 'GROCERIES',
  TRANSPORTATION = 'TRANSPORTATION',
  HEALTHCARE = 'HEALTHCARE',
  ENTERTAINMENT = 'ENTERTAINMENT',
  EDUCATION = 'EDUCATION',
  SHOPPING = 'SHOPPING',
  DINING = 'DINING',
  TRAVEL = 'TRAVEL',
  INSURANCE = 'INSURANCE',
  DEBT_PAYMENT = 'DEBT_PAYMENT',
  SAVINGS = 'SAVINGS',
  OTHER_EXPENSE = 'OTHER_EXPENSE',
}

export interface FinancialRecord {
  _id: string;
  userId: string;
  amount: number;
  type: RecordType;
  category: RecordCategory;
  date: string;           // ISO 8601
  description?: string;
  tags: string[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecordRequest {
  userId: string;
  amount: number;          // > 0
  type: RecordType;
  category: RecordCategory;
  date: string;            // ISO 8601
  description?: string;
  tags?: string[];
}

export interface UpdateRecordRequest {
  amount?: number;
  type?: RecordType;
  category?: RecordCategory;
  date?: string;
  description?: string;
  tags?: string[];
}

export interface RecordFilterParams {
  type?: RecordType;
  category?: RecordCategory;
  startDate?: string;
  endDate?: string;
  search?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
}
```

### `analytics.model.ts`

```ts
export interface DashboardSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  incomeCount: number;
  expenseCount: number;
}

export interface CategoryBreakdownItem {
  _id: string;          // category name
  totalAmount: number;
  count: number;
  type: RecordType;
}

export interface TrendItem {
  period: string;       // "2024-01" for monthly, "2024-W03" for weekly
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
}

export interface RecentActivityItem {
  _id: string;
  amount: number;
  type: RecordType;
  category: RecordCategory;
  date: string;
  description?: string;
  createdAt: string;
}

export interface IncomeExpenseRatio {
  income: number;
  expenses: number;
  ratio: number;        // income / expenses
}
```

### `api-response.model.ts`

```ts
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

---

## API Client Setup

### 1. HTTP Interceptor (`auth.interceptor.ts`)

```ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getAccessToken();

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/')) {
        return authService.refreshToken().pipe(
          switchMap((res) => {
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${res.accessToken}` },
            });
            return next(retryReq);
          }),
          catchError(() => {
            authService.logout();
            router.navigate(['/login']);
            return throwError(() => error);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
```

### 2. Angular Service Structure

```
src/app/
  models/           # TypeScript interfaces (above)
  services/
    api.service.ts       # Base HTTP wrapper
    auth.service.ts      # Login, register, logout, refresh
    user.service.ts      # Profile CRUD
    record.service.ts    # Financial records CRUD
    analytics.service.ts # Dashboard data
  guards/
    auth.guard.ts        # Route protection
    role.guard.ts        # Role-based access
```

### 3. Base API Service

```ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  protected baseUrl = environment.apiUrl;

  constructor(protected http: HttpClient) {}

  get<T>(path: string, params?: Record<string, any>): Observable<ApiResponse<T>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}${path}`, { params: httpParams });
  }

  post<T>(path: string, body?: any): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${path}`, body);
  }

  patch<T>(path: string, body?: any): Observable<ApiResponse<T>> {
    return this.http.patch<ApiResponse<T>>(`${this.baseUrl}${path}`, body);
  }

  delete<T>(path: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}${path}`);
  }
}
```

---

## Authentication Flow

### Auth Service

```ts
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  TokenRefreshResponse,
} from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService extends ApiService {
  private readonly TOKEN_KEY = 'accessToken';
  private readonly REFRESH_KEY = 'refreshToken';

  login(credentials: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.post<AuthResponse>('/auth/login', credentials).pipe(
      tap((res) => {
        if (res.data) {
          localStorage.setItem(this.TOKEN_KEY, res.data.accessToken);
          localStorage.setItem(this.REFRESH_KEY, res.data.refreshToken);
        }
      })
    );
  }

  register(data: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    return this.post<AuthResponse>('/auth/register', data);
  }

  logout(): Observable<ApiResponse<null>> {
    return this.post<null>('/auth/logout').pipe(
      tap(() => this.clearTokens())
    );
  }

  refreshToken(): Observable<TokenRefreshResponse> {
    const refreshToken = localStorage.getItem(this.REFRESH_KEY);
    return this.post<{ accessToken: string }>('/auth/refresh', { refreshToken }).pipe(
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
  }
}
```

---

## API Endpoints Reference

### Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Server status |

```ts
this.api.get('/health');
// Response: { success: true, data: { status: 'ok', uptime: 123, ... } }
```

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login |
| POST | `/api/auth/refresh` | No | Refresh access token |
| POST | `/api/auth/logout` | Yes | End session |
| POST | `/api/auth/forgot-password` | No | Send reset email |
| POST | `/api/auth/reset-password` | No | Reset with token |
| POST | `/api/auth/change-password` | Yes | Change password |

```ts
// Register
this.authService.register({
  email: 'user@example.com',
  password: 'password123',
  name: 'John Doe',
  role: UserRole.VIEWER, // optional, defaults to VIEWER
});
// Response data: { id, email, name, role, status, createdAt }

// Login
this.authService.login({
  email: 'user@example.com',
  password: 'password123',
});
// Response data: { user, accessToken, refreshToken, sessionId }

// Refresh
this.authService.refreshToken();
// Response data: { accessToken }

// Change password
this.api.post('/auth/change-password', {
  currentPassword: 'oldPass123',
  newPassword: 'newPass456',
});
// Response: 200 { success: true, message: "Password changed successfully" }

// Forgot password
this.api.post('/auth/forgot-password', { email: 'user@example.com' });
// Response: 200 { success: true, message: "Password reset email sent if account exists" }

// Reset password
this.api.post('/auth/reset-password', {
  token: '...',
  newPassword: 'newPass456',
});
// Response: 200 { success: true, message: "Password reset successfully" }
```

### Users (Profile - any authenticated user)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/me` | Yes | All | Get own profile |
| PATCH | `/api/me` | Yes | All | Update own profile |

```ts
// Get profile
this.api.get('/me');
// Response data: { id, email, name, role, status, ... }

// Update profile
this.api.patch('/me', { name: 'New Name', phoneNumber: '+1234567890' });
```

### Users (Admin Management)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/users` | Yes | Admin | List all users |
| GET | `/api/users/:id` | Yes | Admin | Get user by ID |
| PATCH | `/api/users/:id` | Yes | Admin | Update user |
| DELETE | `/api/users/:id` | Yes | Admin | Delete user |
| PATCH | `/api/users/:id/role` | Yes | Admin | Change role |
| PATCH | `/api/users/:id/status` | Yes | Admin | Change status |

```ts
// List users (with filters)
this.api.get('/users', { role: 'ANALYST', status: 'ACTIVE', page: 1, limit: 20 });
// Response: { success, data: User[], meta: { page, limit, total, totalPages } }

// Update role
this.api.patch(`/users/${userId}/role`, { role: 'ADMIN' });

// Update status
this.api.patch(`/users/${userId}/status`, { status: 'SUSPENDED' });
```

### Financial Records

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/records` | Yes | All | List records (filterable) |
| GET | `/api/records/:id` | Yes | All | Get single record |
| POST | `/api/records` | Yes | Admin | Create record |
| PATCH | `/api/records/:id` | Yes | Admin | Update record |
| DELETE | `/api/records/:id` | Yes | Admin | Soft-delete record |

#### Query Parameters (GET `/api/records`)

| Param | Type | Example |
|-------|------|---------|
| `type` | `INCOME` / `EXPENSE` | `type=EXPENSE` |
| `category` | RecordCategory enum | `category=GROCERIES` |
| `startDate` | ISO 8601 | `startDate=2024-01-01T00:00:00.000Z` |
| `endDate` | ISO 8601 | `endDate=2024-12-31T23:59:59.999Z` |
| `search` | string | `search=grocer` |
| `minAmount` | number | `minAmount=100` |
| `maxAmount` | number | `maxAmount=5000` |
| `page` | number | `page=1` |
| `limit` | number | `limit=20` |

```ts
// List with filters
this.api.get('/records', {
  type: RecordType.INCOME,
  category: RecordCategory.SALARY,
  startDate: '2024-01-01T00:00:00.000Z',
  endDate: '2024-12-31T23:59:59.999Z',
  page: 1,
  limit: 20,
});
// Response: { success, data: FinancialRecord[], meta: { page, limit, total, totalPages } }

// Create (Admin only)
this.api.post('/records', {
  userId: '...',
  amount: 1500.00,
  type: RecordType.INCOME,
  category: RecordCategory.SALARY,
  date: '2024-06-15T00:00:00.000Z',
  description: 'Monthly salary',
  tags: ['recurring'],
});
// Response: 201 { success, data: FinancialRecord }

// Update (Admin only)
this.api.patch(`/records/${recordId}`, { amount: 1600.00, description: 'Updated' });

// Delete (Admin only)
this.api.delete(`/records/${recordId}`);
// Note: soft delete — record gets isDeleted=true
```

### Analytics

All analytics endpoints require `Analyst` or `Admin` role.

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/analytics/summary` | Yes | Analyst+ | Overall dashboard summary |
| GET | `/api/analytics/categories` | Yes | Analyst+ | Category breakdown |
| GET | `/api/analytics/trends/monthly` | Yes | Analyst+ | Monthly trends |
| GET | `/api/analytics/trends/weekly` | Yes | Analyst+ | Weekly trends |
| GET | `/api/analytics/recent` | Yes | Analyst+ | Recent activity |
| GET | `/api/analytics/ratio` | Yes | Analyst+ | Income/expense ratio |

Common query params for analytics: `userId`, `startDate`, `endDate`.

```ts
// Summary
this.api.get<DashboardSummary>('/analytics/summary');
// Response data: { totalIncome, totalExpenses, netBalance, incomeCount, expenseCount }

// Category breakdown
this.api.get<CategoryBreakdownItem[]>('/analytics/categories');
// Response data: [{ _id: "SALARY", totalAmount: 5000, count: 3, type: "INCOME" }, ...]

// Monthly trends
this.api.get<TrendItem[]>('/analytics/trends/monthly', {
  startDate: '2024-01-01T00:00:00.000Z',
  endDate: '2024-12-31T23:59:59.999Z',
});
// Response data: [{ period: "2024-06", totalIncome: 5000, totalExpenses: 3200, netBalance: 1800 }, ...]

// Weekly trends
this.api.get<TrendItem[]>('/analytics/trends/weekly');

// Recent activity
this.api.get<RecentActivityItem[]>('/analytics/recent', { limit: 10 });

// Income/Expense ratio
this.api.get<IncomeExpenseRatio>('/analytics/ratio');
// Response data: { income: 15000, expenses: 8500, ratio: 1.76 }
```

### Audit Logs (Admin Only)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/audit` | Yes | Admin | List audit logs |

```ts
this.api.get('/audit', {
  userId: '...',     // optional filter
  action: 'CREATE',  // optional
  entity: 'FINANCIAL_RECORD',
  page: 1,
  limit: 50,
});
```

---

## Role-Based UI Patterns

### Route Guard Example

```ts
// role.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRole } from '../models/user.model';

export const roleGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const userRole = localStorage.getItem('userRole') as UserRole;
  const requiredRoles = route.data['roles'] as UserRole[];

  if (!requiredRoles.includes(userRole)) {
    router.navigate(['/dashboard']);
    return false;
  }
  return true;
};
```

### Route Configuration

```ts
const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
  },
  {
    path: 'records',
    component: RecordsComponent,
    canActivate: [authGuard],
  },
  {
    path: 'analytics',
    component: AnalyticsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.ANALYST, UserRole.ADMIN] },
  },
  {
    path: 'admin/users',
    component: UsersComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.ADMIN] },
  },
];
```

### Template Snippet

```html
<!-- Show admin-only button -->
<button *ngIf="userRole === 'ADMIN'" (click)="createRecord()">
  Add Record
</button>

<!-- Disable analytics tab for viewers -->
<mat-tab label="Analytics" [disabled]="userRole === 'VIEWER'">
</mat-tab>

<!-- Show role badge -->
<span class="badge" [ngClass]="{
  'badge-admin': userRole === 'ADMIN',
  'badge-analyst': userRole === 'ANALYST',
  'badge-viewer': userRole === 'VIEWER'
}">
  {{ userRole }}
</span>
```

---

## Error Handling

### Global Error Handler

```ts
import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

export function handleApiError(error: HttpErrorResponse): void {
  const snackBar = inject(MatSnackBar);

  if (error.error?.error) {
    const apiError = error.error.error;
    const message = apiError.details
      ? apiError.details.map((d: any) => `${d.field}: ${d.message}`).join('\n')
      : apiError.message;
    snackBar.open(message, 'Close', { duration: 5000 });
  } else {
    snackBar.open('An unexpected error occurred', 'Close', { duration: 3000 });
  }
}
```

### HTTP Status Codes

| Code | Meaning | Common Cause |
|------|---------|-------------|
| 200 | Success | OK |
| 201 | Created | Resource created |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient role |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate email |
| 500 | Server Error | Backend failure |

---

## Quick Setup Checklist

- [ ] Copy TypeScript interfaces into `src/app/models/`
- [ ] Create `ApiService` base class
- [ ] Create `AuthService` with token management
- [ ] Create `authInterceptor` and provide in `app.config.ts`
- [ ] Create route guards (`authGuard`, `roleGuard`)
- [ ] Configure `environment.ts` with `apiUrl`
- [ ] Implement login page → store tokens
- [ ] Implement dashboard page → call `/api/analytics/summary`
- [ ] Implement records list → call `/api/records`
- [ ] Add role checks in templates
