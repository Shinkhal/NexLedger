import { Component, inject, signal, computed, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { DashboardSummary, TrendItem, RecentActivityItem, CategoryBreakdownItem, IncomeExpenseRatio } from '../../core/models/analytics.model';
import { UserRole } from '../../core/models/user.model';
import { RecordType } from '../../core/models/record.model';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly authService = inject(AuthService);
  private readonly analyticsService = inject(AnalyticsService);
  readonly Math = Math;

  readonly currentUser = this.authService.currentUser;
  
  // Loading & Data States
  readonly loading = signal<boolean>(true);
  readonly summary = signal<DashboardSummary | null>(null);
  readonly trends = signal<TrendItem[]>([]);
  readonly categories = signal<CategoryBreakdownItem[]>([]);
  readonly recentActivity = signal<RecentActivityItem[]>([]);
  readonly ratio = signal<IncomeExpenseRatio | null>(null);

  // Live Clock & Banner State
  readonly currentTime = signal<Date>(new Date());
  private clockIntervalId: ReturnType<typeof setInterval> | null = null;

  // Computed properties
  readonly canViewAnalytics = computed(() => {
    const role = this.currentUser()?.role;
    return role === UserRole.ADMIN || role === UserRole.ANALYST;
  });

  // Savings rate percentage
  readonly savingsRate = computed(() => {
    const s = this.summary();
    if (!s || !s.totalIncome || s.totalIncome === 0) return 0;
    const rate = ((s.netBalance) / s.totalIncome) * 100;
    return Math.max(0, Math.min(100, Math.round(rate)));
  });

  // SVG donut for savings rate
  readonly savingsDonut = computed(() => {
    const pct = this.savingsRate();
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (pct / 100) * circumference;
    return { radius, circumference, offset };
  });

  // Income/Expense ratio bar
  readonly ratioBar = computed(() => {
    const r = this.ratio();
    if (!r) return { incomePercent: 50, expensePercent: 50, ratioValue: '1.00' };
    const total = r.income + r.expenses;
    if (total === 0) return { incomePercent: 50, expensePercent: 50, ratioValue: '0.00' };
    return {
      incomePercent: Math.round((r.income / total) * 100),
      expensePercent: Math.round((r.expenses / total) * 100),
      ratioValue: r.ratio?.toFixed(2) || '0.00',
    };
  });

  // Total transaction count
  readonly totalTransactions = computed(() => {
    const s = this.summary();
    return s?.transactionCount?.total || 0;
  });

  // Chart dimensions
  readonly chartWidth = 560;
  readonly chartHeight = 200;
  readonly chartPadding = 30;

  // Reshape trends data to group by period
  readonly formattedTrends = computed(() => {
    const raw = this.trends();
    if (raw.length === 0) return [];

    const groups: Record<string, { period: string; income: number; expense: number }> = {};
    
    raw.forEach(item => {
      const period = item.month || item.week || 'Unknown';
      if (!groups[period]) {
        groups[period] = { period, income: 0, expense: 0 };
      }
      if (item.type === 'INCOME') {
        groups[period].income += item.totalAmount;
      } else if (item.type === 'EXPENSE') {
        groups[period].expense += item.totalAmount;
      }
    });

    return Object.values(groups).sort((a, b) => a.period.localeCompare(b.period));
  });

  readonly svgPoints = computed(() => {
    const data = this.formattedTrends();
    if (data.length === 0) return { income: '', expense: '', incomeArea: '', expenseArea: '', labels: [] as { x: number; text: string; incomeY: number; expenseY: number; incomeVal: number; expenseVal: number }[] };

    const maxVal = Math.max(
      ...data.map(d => Math.max(d.income, d.expense)),
      1000
    );

    const usableWidth = this.chartWidth - this.chartPadding * 2;
    const usableHeight = this.chartHeight - this.chartPadding * 2;
    const xStep = usableWidth / Math.max(data.length - 1, 1);
    
    const incomeCoords: string[] = [];
    const expenseCoords: string[] = [];
    const labelCoords: { x: number; text: string; incomeY: number; expenseY: number; incomeVal: number; expenseVal: number }[] = [];

    data.forEach((item, index) => {
      const x = this.chartPadding + index * xStep;
      const incomeY = this.chartPadding + usableHeight - ((item.income / maxVal) * usableHeight);
      const expenseY = this.chartPadding + usableHeight - ((item.expense / maxVal) * usableHeight);

      incomeCoords.push(`${x},${incomeY}`);
      expenseCoords.push(`${x},${expenseY}`);

      let labelText = item.period;
      if (item.period.includes('-')) {
        const parts = item.period.split('-');
        const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthNum = parseInt(parts[1], 10);
        labelText = monthNames[monthNum] || parts[1];
      }
      labelCoords.push({ x, text: labelText, incomeY, expenseY, incomeVal: item.income, expenseVal: item.expense });
    });

    // Build area path strings (for gradient fills)
    const bottomY = this.chartPadding + usableHeight;
    const firstX = this.chartPadding;
    const lastX = this.chartPadding + (data.length - 1) * xStep;

    const incomeArea = `M${firstX},${bottomY} ` + incomeCoords.map(c => `L${c}`).join(' ') + ` L${lastX},${bottomY} Z`;
    const expenseArea = `M${firstX},${bottomY} ` + expenseCoords.map(c => `L${c}`).join(' ') + ` L${lastX},${bottomY} Z`;

    return {
      income: incomeCoords.join(' '),
      expense: expenseCoords.join(' '),
      incomeArea,
      expenseArea,
      labels: labelCoords
    };
  });

  // Category Breakdown — expenses (top 5)
  readonly topExpenses = computed(() => {
    return this.categories()
      .filter(c => c.type === RecordType.EXPENSE)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);
  });

  // Category Breakdown — income sources (top 5)
  readonly topIncome = computed(() => {
    return this.categories()
      .filter(c => c.type === RecordType.INCOME)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);
  });

  // Top income source name
  readonly topIncomeSource = computed(() => {
    const top = this.topIncome();
    return top.length > 0 ? this.getCategoryLabel(top[0].category) : 'N/A';
  });

  // Top expense category name
  readonly topExpenseCategory = computed(() => {
    const top = this.topExpenses();
    return top.length > 0 ? this.getCategoryLabel(top[0].category) : 'N/A';
  });

  // Welcome Banner Dynamic Colors and Greetings
  readonly welcomeBannerDetails = computed(() => {
    this.currentTime(); // subscribe to clock updates
    const hours = new Date().getHours();
    const name = this.authService.currentUser()?.name || 'User';
    
    if (hours < 12) {
      return {
        greeting: `Good morning, ${name}`,
        subtitle: 'Start your financial assessment for today.',
        bgImage: '/morning.png',
        overlayClass: 'from-amber-600/90 via-orange-600/80 to-yellow-600/70',
        iconPath: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z'
      };
    } else if (hours < 17) {
      return {
        greeting: `Good afternoon, ${name}`,
        subtitle: 'Review your company ledger accounts and trends.',
        bgImage: '/afternoon.png',
        overlayClass: 'from-sky-600/90 via-blue-600/85 to-indigo-700/80',
        iconPath: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z'
      };
    } else if (hours < 19) {
      return {
        greeting: `Good evening, ${name}`,
        subtitle: 'Review database audit details and records.',
        bgImage: '/evening.png',
        overlayClass: 'from-indigo-700/90 via-purple-700/85 to-pink-600/70',
        iconPath: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z'
      };
    } else {
      return {
        greeting: `Good night, ${name}`,
        subtitle: 'Wrap up your balance reports and active sessions.',
        bgImage: '/night.png',
        overlayClass: 'from-slate-950/95 via-indigo-950/90 to-slate-950/95',
        iconPath: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'
      };
    }
  });

  getCategoryPercentage(amount: number): number {
    const totalExp = this.summary()?.totalExpenses || 1;
    return Math.min(Math.round((amount / totalExp) * 100), 100);
  }

  getIncomePercentage(amount: number): number {
    const totalInc = this.summary()?.totalIncome || 1;
    return Math.min(Math.round((amount / totalInc) * 100), 100);
  }

  ngOnInit(): void {
    this.loadDashboardData();
    this.startClock();
  }

  ngOnDestroy(): void {
    if (this.clockIntervalId) {
      clearInterval(this.clockIntervalId);
    }
  }

  startClock(): void {
    if (typeof window !== 'undefined') {
      this.clockIntervalId = setInterval(() => {
        this.currentTime.set(new Date());
      }, 1000);
    }
  }

  loadDashboardData(): void {
    this.loading.set(true);

    this.analyticsService.getSummary().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.summary.set(res.data);
        }
      }
    });

    this.analyticsService.getRecentActivity(8).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.recentActivity.set(res.data);
        }
      }
    });

    const isAnalystOrAdmin = this.canViewAnalytics();
    if (isAnalystOrAdmin) {
      this.analyticsService.getMonthlyTrends().subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.trends.set(res.data);
          }
        }
      });

      this.analyticsService.getCategories().subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.categories.set(res.data);
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });

      this.analyticsService.getRatio().subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.ratio.set(res.data);
          }
        }
      });
    } else {
      this.loading.set(false);
    }
  }

  getRecordTypeClass(type: string): string {
    return type === RecordType.INCOME 
      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30' 
      : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30';
  }

  getCategoryLabel(cat: string): string {
    return cat.replace(/_/g, ' ').toLowerCase();
  }

  getCategoryColorClass(category: string): string {
    if (!category) return 'bg-slate-500';
    const cat = category.toLowerCase().trim();
    switch (cat) {
      case 'housing': case 'rent': case 'home': { return 'bg-violet-500'; }
      case 'utilities': case 'bills': case 'water': case 'electricity': { return 'bg-sky-500'; }
      case 'groceries': case 'food': case 'dining': { return 'bg-emerald-500'; }
      case 'transportation': case 'travel': case 'fuel': case 'car': { return 'bg-amber-500'; }
      case 'entertainment': case 'leisure': case 'fun': case 'movies': { return 'bg-rose-500'; }
      case 'insurance': case 'health': case 'medical': case 'healthcare': { return 'bg-cyan-500'; }
      case 'salary': { return 'bg-indigo-500'; }
      case 'freelance': { return 'bg-teal-500'; }
      case 'investment': { return 'bg-emerald-500'; }
      case 'business': { return 'bg-blue-500'; }
      case 'education': { return 'bg-purple-500'; }
      case 'shopping': { return 'bg-pink-500'; }
      case 'savings': { return 'bg-lime-500'; }
      case 'debt_payment': case 'debt payment': { return 'bg-orange-500'; }
      default: {
        const colors = ['bg-indigo-500', 'bg-teal-500', 'bg-fuchsia-500', 'bg-orange-500', 'bg-blue-500'];
        let hash = 0;
        for (let i = 0; i < cat.length; i++) {
          hash = cat.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
      }
    }
  }

  getCategoryDotColor(category: string): string {
    return this.getCategoryColorClass(category).replace('bg-', 'text-').replace('-500', '-500');
  }
}
