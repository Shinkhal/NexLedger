import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecordService } from '../../core/services/record.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { FinancialRecord, RecordType, RecordCategory, RecordFilterParams, CreateRecordRequest } from '../../core/models/record.model';
import { UserRole } from '../../core/models/user.model';
import { RecordModalComponent } from './record-modal/record-modal.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmDialogService } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-records',
  imports: [CommonModule, FormsModule, DatePipe, RecordModalComponent, ModalComponent],
  templateUrl: './records.component.html',
  styleUrl: './records.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecordsComponent implements OnInit {
  private readonly recordService = inject(RecordService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly currentUser = this.authService.currentUser;
  
  // Data States
  readonly records = signal<FinancialRecord[]>([]);
  readonly loading = signal<boolean>(true);
  
  // Pagination State
  readonly currentPage = signal<number>(1);
  readonly totalPages = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly totalRecords = signal<number>(0);

  // Filters State
  readonly search = signal<string>('');
  readonly type = signal<string>('ALL');
  readonly category = signal<string>('ALL');
  readonly startDate = signal<string>('');
  readonly endDate = signal<string>('');
  readonly minAmount = signal<number | null>(null);
  readonly maxAmount = signal<number | null>(null);

  // Filter Panel Toggle
  readonly showFilters = signal<boolean>(false);

  // Modal State
  readonly isModalOpen = signal<boolean>(false);
  readonly selectedRecord = signal<FinancialRecord | null>(null);

  // Roles permission check
  readonly isAdmin = computed(() => {
    return this.currentUser()?.role === UserRole.ADMIN;
  });

  // Category Lists
  readonly categories = [
    { value: RecordCategory.SALARY, label: 'Salary' },
    { value: RecordCategory.FREELANCE, label: 'Freelance' },
    { value: RecordCategory.INVESTMENT, label: 'Investment' },
    { value: RecordCategory.BUSINESS, label: 'Business' },
    { value: RecordCategory.GIFT, label: 'Gift' },
    { value: RecordCategory.OTHER_INCOME, label: 'Other Income' },
    { value: RecordCategory.HOUSING, label: 'Housing' },
    { value: RecordCategory.UTILITIES, label: 'Utilities' },
    { value: RecordCategory.GROCERIES, label: 'Groceries' },
    { value: RecordCategory.TRANSPORTATION, label: 'Transportation' },
    { value: RecordCategory.HEALTHCARE, label: 'Healthcare' },
    { value: RecordCategory.ENTERTAINMENT, label: 'Entertainment' },
    { value: RecordCategory.EDUCATION, label: 'Education' },
    { value: RecordCategory.SHOPPING, label: 'Shopping' },
    { value: RecordCategory.DINING, label: 'Dining' },
    { value: RecordCategory.TRAVEL, label: 'Travel' },
    { value: RecordCategory.INSURANCE, label: 'Insurance' },
    { value: RecordCategory.DEBT_PAYMENT, label: 'Debt Payment' },
    { value: RecordCategory.SAVINGS, label: 'Savings' },
    { value: RecordCategory.OTHER_EXPENSE, label: 'Other Expense' },
  ];

  ngOnInit(): void {
    this.loadRecords();
  }

  loadRecords(): void {
    this.loading.set(true);

    // Build filter parameters
    const params: RecordFilterParams = {
      page: this.currentPage(),
      limit: this.pageSize(),
    };

    if (this.type() !== 'ALL') {
      params.type = this.type() as RecordType;
    }
    if (this.category() !== 'ALL') {
      params.category = this.category() as RecordCategory;
    }
    if (this.search().trim()) {
      params.search = this.search().trim();
    }
    if (this.startDate()) {
      params.startDate = new Date(this.startDate()).toISOString();
    }
    if (this.endDate()) {
      params.endDate = new Date(this.endDate()).toISOString();
    }
    if (this.minAmount() !== null && this.minAmount() !== undefined) {
      params.minAmount = this.minAmount()!;
    }
    if (this.maxAmount() !== null && this.maxAmount() !== undefined) {
      params.maxAmount = this.maxAmount()!;
    }

    this.recordService.listRecords(params).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.records.set(res.data);
          if (res.meta) {
            this.currentPage.set(res.meta.page);
            this.totalPages.set(res.meta.totalPages);
            this.totalRecords.set(res.meta.total);
          }
        }
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Failed to retrieve ledger records');
      }
    });
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadRecords();
  }

  resetFilters(): void {
    this.search.set('');
    this.type.set('ALL');
    this.category.set('ALL');
    this.startDate.set('');
    this.endDate.set('');
    this.minAmount.set(null);
    this.maxAmount.set(null);
    this.currentPage.set(1);
    this.loadRecords();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadRecords();
  }

  toggleFilterPanel(): void {
    this.showFilters.update(v => !v);
  }

  // --- CRUD Modal Actions (Admin Only) ---

  openAddModal(): void {
    if (!this.isAdmin()) return;
    this.selectedRecord.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(record: FinancialRecord): void {
    if (!this.isAdmin()) return;
    this.selectedRecord.set(record);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedRecord.set(null);
  }

  onSaveRecord(formValue: CreateRecordRequest): void {
    if (!this.isAdmin()) return;

    this.loading.set(true);
    const recordId = this.selectedRecord()?._id;

    if (recordId) {
      // Edit mode
      this.recordService.updateRecord(recordId, formValue).subscribe({
        next: () => {
          this.loading.set(false);
          this.isModalOpen.set(false);
          this.toast.success('Record modified successfully');
          this.loadRecords();
        },
        error: (err) => {
          this.loading.set(false);
          const errMsg = err.error?.error?.message || 'Failed to update record';
          this.toast.error(errMsg);
        }
      });
    } else {
      // Create mode
      this.recordService.createRecord(formValue).subscribe({
        next: () => {
          this.loading.set(false);
          this.isModalOpen.set(false);
          this.toast.success('New record created successfully');
          this.currentPage.set(1); // Go back to page 1
          this.loadRecords();
        },
        error: (err) => {
          this.loading.set(false);
          const errMsg = err.error?.error?.message || 'Failed to create record';
          this.toast.error(errMsg);
        }
      });
    }
  }

  async onDeleteRecord(record: FinancialRecord): Promise<void> {
    if (!this.isAdmin()) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete Transaction Record',
      message: `Are you sure you want to delete this record of $${record.amount} for "${record.description || record.category}"? This action cannot be undone.`,
      confirmText: 'Delete Record',
      cancelText: 'Cancel',
      type: 'danger',
    });

    if (!confirmed) return;

    this.loading.set(true);
    this.recordService.deleteRecord(record._id).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Record soft-deleted successfully');
        this.loadRecords();
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Failed to delete record');
      }
    });
  }

  getRecordTypeClass(type: RecordType): string {
    return type === RecordType.INCOME 
      ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/60' 
      : 'text-rose-700 dark:text-rose-450 bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/60';
  }

  getCategoryLabel(cat: string): string {
    return cat.replace('_', ' ').toLowerCase();
  }
}
