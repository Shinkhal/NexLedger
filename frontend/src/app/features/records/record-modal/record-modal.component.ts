import { Component, inject, input, output, effect, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RecordType, RecordCategory, FinancialRecord, CreateRecordRequest } from '../../../core/models/record.model';

@Component({
  selector: 'app-record-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './record-modal.component.html',
  styleUrl: './record-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecordModalComponent {
  private readonly fb = inject(FormBuilder);

  readonly isOpen = input<boolean>(false);
  readonly record = input<FinancialRecord | null>(null);

  readonly dismiss = output<void>();
  readonly saveRecord = output<CreateRecordRequest>();
  readonly loading = input<boolean>(false);

  setType(type: 'INCOME' | 'EXPENSE'): void {
    this.recordForm.get('type')?.setValue(type);
  }

  readonly recordForm: FormGroup = this.fb.group({
    amount: [0, [Validators.required, Validators.min(0.01)]],
    type: [RecordType.EXPENSE, [Validators.required]],
    category: [RecordCategory.GROCERIES, [Validators.required]],
    date: [new Date().toISOString().split('T')[0], [Validators.required]],
    description: ['', [Validators.maxLength(500)]],
    tagsInput: [''],
  });

  // Categorized options based on Type
  readonly categories = signal<string[]>([]);

  readonly incomeCategories = [
    { value: RecordCategory.SALARY, label: 'Salary' },
    { value: RecordCategory.FREELANCE, label: 'Freelance' },
    { value: RecordCategory.INVESTMENT, label: 'Investment' },
    { value: RecordCategory.BUSINESS, label: 'Business' },
    { value: RecordCategory.GIFT, label: 'Gift' },
    { value: RecordCategory.OTHER_INCOME, label: 'Other Income' },
  ];

  readonly expenseCategories = [
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

  constructor() {
    // Populate form if we have an incoming record
    effect(() => {
      const rec = this.record();
      if (rec) {
        this.recordForm.patchValue({
          amount: rec.amount,
          type: rec.type,
          category: rec.category,
          date: new Date(rec.date).toISOString().split('T')[0],
          description: rec.description || '',
          tagsInput: rec.tags ? rec.tags.join(', ') : '',
        });
        this.onTypeChange(rec.type);
      } else {
        this.recordForm.reset({
          amount: 0,
          type: RecordType.EXPENSE,
          category: RecordCategory.GROCERIES,
          date: new Date().toISOString().split('T')[0],
          description: '',
          tagsInput: '',
        });
        this.onTypeChange(RecordType.EXPENSE);
      }
    });

    // Watch type changes to update category lists
    this.recordForm.get('type')?.valueChanges.subscribe(type => {
      this.onTypeChange(type);
    });
  }

  onTypeChange(type: RecordType): void {
    const list = type === RecordType.INCOME ? this.incomeCategories : this.expenseCategories;
    // Set a default category when changing types to avoid validation bugs
    const currentVal = this.recordForm.get('category')?.value;
    const isValInList = list.some(c => c.value === currentVal);
    
    if (!isValInList) {
      this.recordForm.patchValue({
        category: list[0]?.value
      });
    }
  }

  getCurrentCategories() {
    return this.recordForm.get('type')?.value === RecordType.INCOME 
      ? this.incomeCategories 
      : this.expenseCategories;
  }

  onSubmit(): void {
    if (this.recordForm.invalid) {
      this.recordForm.markAllAsTouched();
      return;
    }

    const formVal = this.recordForm.value;
    
    // Parse tags: split by comma, trim whitespace, filter empty strings
    const tags = formVal.tagsInput
      ? formVal.tagsInput.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
      : [];

    const result = {
      amount: Number(formVal.amount),
      type: formVal.type,
      category: formVal.category,
      date: new Date(formVal.date).toISOString(), // backend expects ISO format
      description: formVal.description,
      tags,
    };

    this.saveRecord.emit(result);
  }
}
