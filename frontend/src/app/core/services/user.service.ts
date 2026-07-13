import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { User, UpdateProfileRequest, UserRole, UserStatus } from '../models/user.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class UserService extends ApiService {
  // Update own profile
  updateProfile(data: UpdateProfileRequest): Observable<ApiResponse<User>> {
    return this.patch<User>('/me', data);
  }

  // Change own password
  changePassword(data: { currentPassword: string; newPassword: string }): Observable<ApiResponse<null>> {
    return this.post<null>('/auth/change-password', data);
  }

  // --- Admin User Management Endpoints ---

  // Admin creates a user (validates email uniqueness, hashes password)
  createUser(data: { name: string; email: string; role: UserRole; password?: string; status?: UserStatus }): Observable<ApiResponse<User>> {
    return this.post<User>('/users', data);
  }

  // List users with body filters
  listUsers(filters?: { role?: string; status?: string; page?: number; limit?: number }): Observable<ApiResponse<User[]>> {
    return this.query<User[]>('/users', filters);
  }

  getUserById(id: string): Observable<ApiResponse<User>> {
    return this.get<User>(`/users/${id}`);
  }

  updateUser(id: string, data: Partial<User>): Observable<ApiResponse<User>> {
    return this.patch<User>(`/users/${id}`, data);
  }

  deleteUser(id: string): Observable<ApiResponse<null>> {
    return this.delete<null>(`/users/${id}`);
  }

  updateUserRole(id: string, role: UserRole): Observable<ApiResponse<User>> {
    return this.patch<User>(`/users/${id}/role`, { role });
  }

  updateUserStatus(id: string, status: UserStatus): Observable<ApiResponse<User>> {
    return this.patch<User>(`/users/${id}/status`, { status });
  }

  // Admin Audit Logs (with body filters)
  getAuditLogs(params?: Record<string, unknown>): Observable<ApiResponse<unknown[]>> {
    return this.query<unknown[]>('/audit', params);
  }
}
