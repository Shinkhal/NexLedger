import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { User, UserRole, UserStatus } from '../../core/models/user.model';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmDialogService } from '../../shared/components/confirm-dialog/confirm-dialog.component';

interface AuditLogEntry {
  id: string;
  createdAt: string;
  action: string;
  userEmail: string;
  status: string;
  details: string;
}

@Component({
  selector: 'app-users',
  imports: [CommonModule, FormsModule, DatePipe, ModalComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly users = signal<User[]>([]);
  readonly auditLogs = signal<AuditLogEntry[]>([]);
  readonly loading = signal<boolean>(true);
  readonly loadingLogs = signal<boolean>(false);
  readonly loadingCreate = signal<boolean>(false);

  // Tabs: 'users' | 'audit'
  readonly activeTab = signal<'users' | 'audit'>('users');

  // Creation State
  readonly isCreateModalOpen = signal<boolean>(false);
  readonly createName = signal<string>('');
  readonly createEmail = signal<string>('');
  readonly createPassword = signal<string>('');
  readonly createRole = signal<UserRole>(UserRole.VIEWER);
  readonly createStatus = signal<UserStatus>(UserStatus.ACTIVE);

  // Role list for editing
  readonly availableRoles = [
    { value: UserRole.VIEWER, label: 'Viewer' },
    { value: UserRole.ANALYST, label: 'Analyst' },
    { value: UserRole.ADMIN, label: 'Admin' }
  ];

  // Status list for editing
  readonly availableStatuses = [
    { value: UserStatus.ACTIVE, label: 'Active' },
    { value: UserStatus.INACTIVE, label: 'Inactive' },
    { value: UserStatus.SUSPENDED, label: 'Suspended' }
  ];

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.userService.listUsers().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.users.set(res.data);
        }
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Failed to load user accounts list');
      }
    });
  }

  loadAuditLogs(): void {
    this.loadingLogs.set(true);
    this.userService.getAuditLogs({ limit: 50 }).subscribe({
      next: (res) => {
        this.loadingLogs.set(false);
        if (res.success && res.data) {
          this.auditLogs.set(res.data as AuditLogEntry[]);
        }
      },
      error: () => {
        this.loadingLogs.set(false);
        this.toast.error('Failed to retrieve security audit logs');
      }
    });
  }

  switchTab(tab: 'users' | 'audit'): void {
    this.activeTab.set(tab);
    if (tab === 'audit' && this.auditLogs().length === 0) {
      this.loadAuditLogs();
    }
  }

  onChangeRole(user: User, event: Event): void {
    const nextRole = (event.target as HTMLSelectElement).value as UserRole;
    if (nextRole === user.role) return;

    this.userService.updateUserRole(user._id, nextRole).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success(`Role for ${user.name} changed to ${nextRole}`);
          this.loadUsers();
        }
      },
      error: (err) => {
        this.toast.error(err.error?.error?.message || 'Unauthorized action to modify roles');
        this.loadUsers();
      }
    });
  }

  onChangeStatus(user: User, event: Event): void {
    const nextStatus = (event.target as HTMLSelectElement).value as UserStatus;
    if (nextStatus === user.status) return;

    this.userService.updateUserStatus(user._id, nextStatus).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success(`Status for ${user.name} changed to ${nextStatus}`);
          this.loadUsers();
        }
      },
      error: (err) => {
        this.toast.error(err.error?.error?.message || 'Unauthorized action to modify status');
        this.loadUsers();
      }
    });
  }

  async onDeleteUser(user: User): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete User Account',
      message: `Are you sure you want to permanently delete "${user.name}" (${user.email})? This action cannot be undone.`,
      confirmText: 'Delete User',
      cancelText: 'Cancel',
      type: 'danger',
    });

    if (!confirmed) return;

    this.loading.set(true);
    this.userService.deleteUser(user._id).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success(`User ${user.name} deleted successfully`);
        this.loadUsers();
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Failed to delete user account');
      }
    });
  }

  openCreateModal(): void {
    this.createName.set('');
    this.createEmail.set('');
    this.createPassword.set('');
    this.createRole.set(UserRole.VIEWER);
    this.createStatus.set(UserStatus.ACTIVE);
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  onSubmitCreateUser(): void {
    if (!this.createName().trim() || !this.createEmail().trim() || !this.createPassword().trim()) {
      this.toast.error('Please fill in all required fields');
      return;
    }

    this.loadingCreate.set(true);
    this.userService.createUser({
      name: this.createName().trim(),
      email: this.createEmail().trim(),
      password: this.createPassword().trim(),
      role: this.createRole(),
      status: this.createStatus()
    }).subscribe({
      next: (res) => {
        this.loadingCreate.set(false);
        if (res.success) {
          this.toast.success(`User account for ${res.data?.name} created successfully`);
          this.closeCreateModal();
          this.loadUsers();
        }
      },
      error: (err) => {
        this.loadingCreate.set(false);
        this.toast.error(err.error?.error?.message || 'Failed to create user account');
      }
    });
  }

  getRoleBadgeClass(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN: return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/60';
      case UserRole.ANALYST: return 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 border-violet-200 dark:border-violet-900/60';
      case UserRole.VIEWER:
      default:
        return 'bg-slate-50 text-slate-700 dark:bg-slate-800/40 dark:text-slate-400 border-slate-200 dark:border-slate-800';
    }
  }

  getStatusBadgeClass(status: UserStatus): string {
    switch (status) {
      case UserStatus.ACTIVE: return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60';
      case UserStatus.INACTIVE: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
      case UserStatus.SUSPENDED: return 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border-red-200 dark:border-red-900/60';
    }
  }

  getAuditActionColor(action: string): string {
    switch (action) {
      case 'CREATE': return 'text-emerald-600 dark:text-emerald-400 font-bold';
      case 'UPDATE': return 'text-amber-600 dark:text-amber-500 font-bold';
      case 'DELETE': return 'text-rose-600 dark:text-rose-400 font-bold';
      default: return 'text-slate-500 dark:text-slate-400 font-semibold';
    }
  }
}
