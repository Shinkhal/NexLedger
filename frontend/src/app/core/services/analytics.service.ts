import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  DashboardSummary,
  CategoryBreakdownItem,
  TrendItem,
  RecentActivityItem,
  IncomeExpenseRatio,
} from '../models/analytics.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class AnalyticsService extends ApiService {
  getSummary(params?: { userId?: string; startDate?: string; endDate?: string }): Observable<ApiResponse<DashboardSummary>> {
    return this.query<DashboardSummary>('/analytics/summary', params);
  }

  getCategories(params?: { userId?: string; startDate?: string; endDate?: string }): Observable<ApiResponse<CategoryBreakdownItem[]>> {
    return this.query<CategoryBreakdownItem[]>('/analytics/categories', params);
  }

  getMonthlyTrends(params?: { userId?: string; startDate?: string; endDate?: string }): Observable<ApiResponse<TrendItem[]>> {
    return this.query<TrendItem[]>('/analytics/trends/monthly', params);
  }

  getWeeklyTrends(params?: { userId?: string; startDate?: string; endDate?: string }): Observable<ApiResponse<TrendItem[]>> {
    return this.query<TrendItem[]>('/analytics/trends/weekly', params);
  }

  getRecentActivity(limit = 10): Observable<ApiResponse<RecentActivityItem[]>> {
    return this.query<RecentActivityItem[]>('/analytics/recent', { limit });
  }

  getRatio(params?: { userId?: string; startDate?: string; endDate?: string }): Observable<ApiResponse<IncomeExpenseRatio>> {
    return this.query<IncomeExpenseRatio>('/analytics/ratio', params);
  }
}
