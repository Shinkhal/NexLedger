import { FinancialRecord, RecordType, RecordCategory } from "../models";
import { AppError } from "../utils/appError.util";
import { logger } from "../utils/logger.util";
import { PaginationParams } from "../types";

interface CreateRecordInput {
  userId: string;
  amount: number;
  type: RecordType;
  category: RecordCategory;
  date: string;
  description?: string;
  tags?: string[];
  attachments?: string[];
}

interface ListRecordsFilters {
  userId?: string;
  type?: RecordType;
  category?: RecordCategory;
  startDate?: string;
  endDate?: string;
  search?: string;
  minAmount?: number;
  maxAmount?: number;
}

interface UpdateRecordInput {
  amount?: number;
  type?: RecordType;
  category?: RecordCategory;
  date?: string;
  description?: string;
  tags?: string[];
  attachments?: string[];
}

export class RecordService {
  private constructor() {}

  static async create(input: CreateRecordInput) {
    const doc = await FinancialRecord.create({
      userId: input.userId,
      amount: input.amount,
      type: input.type,
      category: input.category,
      date: new Date(input.date),
      description: input.description,
      tags: input.tags || [],
      attachments: input.attachments || [],
    });

    const record = await FinancialRecord.findById(doc._id)
      .populate("userId", ["_id", "name", "email"])
      .lean();

    logger.info(`Financial record created: ${doc._id} (${doc.type})`);
    return record;
  }

  static async list(filters: ListRecordsFilters, pagination: PaginationParams) {
    const query: Record<string, unknown> = { isDeleted: false };

    if (filters.userId) query.userId = filters.userId;
    if (filters.type) query.type = filters.type;
    if (filters.category) query.category = filters.category;

    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) (query.date as Record<string, Date>).$gte = new Date(filters.startDate);
      if (filters.endDate) (query.date as Record<string, Date>).$lte = new Date(filters.endDate);
    }

    if (filters.minAmount || filters.maxAmount) {
      query.amount = {};
      if (filters.minAmount) (query.amount as Record<string, number>).$gte = filters.minAmount;
      if (filters.maxAmount) (query.amount as Record<string, number>).$lte = filters.maxAmount;
    }

    if (filters.search) {
      query.description = { $regex: filters.search, $options: "i" };
    }

    const [records, total] = await Promise.all([
      FinancialRecord.find(query)
        .populate("userId", ["_id", "name", "email"])
        .sort({ date: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      FinancialRecord.countDocuments(query),
    ]);

    return { records, total };
  }

  static async getById(id: string) {
    const record = await FinancialRecord.findOne({ _id: id, isDeleted: false })
      .populate("userId", ["_id", "name", "email"])
      .lean();
    if (!record) throw AppError.notFound("Financial record");
    return record;
  }

  static async update(id: string, data: UpdateRecordInput) {
    const existing = await FinancialRecord.findOne({ _id: id, isDeleted: false });
    if (!existing) throw AppError.notFound("Financial record");

    const updateData: Record<string, unknown> = {};
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.description !== undefined) updateData.description = data.description;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.attachments !== undefined) updateData.attachments = data.attachments;

    const record = await FinancialRecord.findByIdAndUpdate(id, updateData, { new: true })
      .populate("userId", ["_id", "name", "email"])
      .lean();

    logger.info(`Financial record updated: ${id}`);
    return record;
  }

  static async delete(id: string, deletedBy: string) {
    const existing = await FinancialRecord.findOne({ _id: id, isDeleted: false });
    if (!existing) throw AppError.notFound("Financial record");

    await FinancialRecord.findByIdAndUpdate(id, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy,
    });

    logger.info(`Financial record soft-deleted: ${id} by ${deletedBy}`);
  }
}
