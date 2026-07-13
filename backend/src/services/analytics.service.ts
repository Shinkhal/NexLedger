import { FinancialRecord } from "../models";

interface AnalyticsFilters {
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export class AnalyticsService {
  private constructor() {}

  private static buildBaseMatch(filters: AnalyticsFilters): Record<string, unknown> {
    const match: Record<string, unknown> = { isDeleted: false };

    if (filters.userId) match.userId = filters.userId;

    if (filters.startDate || filters.endDate) {
      match.date = {};
      if (filters.startDate) (match.date as Record<string, Date>).$gte = new Date(filters.startDate);
      if (filters.endDate) (match.date as Record<string, Date>).$lte = new Date(filters.endDate);
    }

    return match;
  }

  static async getSummary(filters: AnalyticsFilters) {
    const match = AnalyticsService.buildBaseMatch(filters);

    const [incomeResult, expenseResult] = await Promise.all([
      FinancialRecord.aggregate([
        { $match: { ...match, type: "INCOME" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      FinancialRecord.aggregate([
        { $match: { ...match, type: "EXPENSE" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
    ]);

    const totalIncome = incomeResult[0]?.total || 0;
    const totalExpenses = expenseResult[0]?.total || 0;
    const incomeCount = incomeResult[0]?.count || 0;
    const expenseCount = expenseResult[0]?.count || 0;

    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      transactionCount: {
        income: incomeCount,
        expense: expenseCount,
        total: incomeCount + expenseCount,
      },
    };
  }

  static async getCategoryBreakdown(filters: AnalyticsFilters) {
    const match = AnalyticsService.buildBaseMatch(filters);

    const breakdown = await FinancialRecord.aggregate([
      { $match: match },
      {
        $group: {
          _id: { category: "$category", type: "$type" },
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
      {
        $project: {
          _id: 0,
          category: "$_id.category",
          type: "$_id.type",
          totalAmount: 1,
          count: 1,
        },
      },
    ]);

    return breakdown;
  }

  static async getMonthlyTrends(filters: AnalyticsFilters) {
    const match = AnalyticsService.buildBaseMatch(filters);

    const trends = await FinancialRecord.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            type: "$type",
          },
          totalAmount: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.type": 1 },
      },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: "$_id.year" },
              "-",
              {
                $cond: {
                  if: { $lt: ["$_id.month", 10] },
                  then: { $concat: ["0", { $toString: "$_id.month" }] },
                  else: { $toString: "$_id.month" },
                },
              },
            ],
          },
          type: "$_id.type",
          totalAmount: 1,
          transactionCount: 1,
        },
      },
    ]);

    return trends;
  }

  static async getWeeklyTrends(filters: AnalyticsFilters) {
    const match = AnalyticsService.buildBaseMatch(filters);

    const trends = await FinancialRecord.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: "$date" },
            week: { $isoWeek: "$date" },
            type: "$type",
          },
          totalAmount: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.week": 1, "_id.type": 1 } },
      {
        $project: {
          _id: 0,
          week: {
            $concat: [
              { $toString: "$_id.year" },
              "-W",
              {
                $cond: {
                  if: { $lt: ["$_id.week", 10] },
                  then: { $concat: ["0", { $toString: "$_id.week" }] },
                  else: { $toString: "$_id.week" },
                },
              },
            ],
          },
          type: "$_id.type",
          totalAmount: 1,
          transactionCount: 1,
        },
      },
    ]);

    return trends;
  }

  static async getRecentActivity(filters: AnalyticsFilters, limit = 10) {
    const match = AnalyticsService.buildBaseMatch(filters);

    return FinancialRecord.find(match)
      .populate("userId", ["_id", "name", "email"])
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  static async getIncomeExpenseRatio(filters: AnalyticsFilters) {
    const summary = await AnalyticsService.getSummary(filters);

    const ratio =
      summary.totalExpenses > 0
        ? +(summary.totalIncome / summary.totalExpenses).toFixed(2)
        : summary.totalIncome > 0
        ? Infinity
        : 0;

    return {
      ...summary,
      ratio,
      savingsRate:
        summary.totalIncome > 0
          ? +((summary.netBalance / summary.totalIncome) * 100).toFixed(2)
          : 0,
    };
  }
}
