import mongoose, { Schema, Document, Types } from "mongoose";

export enum RecordType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
}

export enum RecordCategory {
  SALARY = "SALARY",
  FREELANCE = "FREELANCE",
  INVESTMENT = "INVESTMENT",
  BUSINESS = "BUSINESS",
  GIFT = "GIFT",
  OTHER_INCOME = "OTHER_INCOME",
  HOUSING = "HOUSING",
  UTILITIES = "UTILITIES",
  GROCERIES = "GROCERIES",
  TRANSPORTATION = "TRANSPORTATION",
  HEALTHCARE = "HEALTHCARE",
  ENTERTAINMENT = "ENTERTAINMENT",
  EDUCATION = "EDUCATION",
  SHOPPING = "SHOPPING",
  DINING = "DINING",
  TRAVEL = "TRAVEL",
  INSURANCE = "INSURANCE",
  DEBT_PAYMENT = "DEBT_PAYMENT",
  SAVINGS = "SAVINGS",
  OTHER_EXPENSE = "OTHER_EXPENSE",
}

export interface IFinancialRecord extends Document {
  userId: Types.ObjectId;
  amount: number;
  type: RecordType;
  category: RecordCategory;
  date: Date;
  description?: string;
  tags: string[];
  attachments: string[];
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FinancialRecordSchema = new Schema<IFinancialRecord>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, enum: Object.values(RecordType), required: true },
    category: { type: String, enum: Object.values(RecordCategory), required: true },
    date: { type: Date, required: true },
    description: { type: String },
    tags: { type: [String], default: [] },
    attachments: { type: [String], default: [] },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: String },
  },
  {
    timestamps: true,
    collection: "financial_records",
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

FinancialRecordSchema.index({ userId: 1, date: -1 });
FinancialRecordSchema.index({ userId: 1, type: 1 });
FinancialRecordSchema.index({ userId: 1, category: 1 });
FinancialRecordSchema.index({ date: -1 });
FinancialRecordSchema.index({ type: 1 });
FinancialRecordSchema.index({ category: 1 });
FinancialRecordSchema.index({ isDeleted: 1 });
FinancialRecordSchema.index({ userId: 1, isDeleted: 1, date: -1 });

export const FinancialRecord = mongoose.model<IFinancialRecord>("FinancialRecord", FinancialRecordSchema);
