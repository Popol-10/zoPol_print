import { apiRequest, withBearer } from "@/lib/api";
import type { OrderRecord } from "@/lib/orders";

export type DashboardPeriod = "month" | "quarter" | "year";

export interface DashboardMonthlyRecord {
  month: string;
  label: string;
  income: number;
  expenses: number;
}

export interface DashboardData {
  period: DashboardPeriod;
  periodStart: string;
  periodEnd: string;
  finance: {
    income: number;
    expenses: number;
    netResult: number;
    monthly: DashboardMonthlyRecord[];
  } | null;
  sales: {
    orderCount: number;
    totalSales: number;
    estimatedMargin: number;
    marginPercent: number;
  };
  activeOrderCount: number;
  dueTodayCount: number;
  criticalStockCount: number;
  stock: {
    itemCount: number;
    inventoryValue: number;
  };
  people: {
    activeEmployeeCount: number;
    recordedTodayCount: number;
    presentTodayCount: number;
    attendanceRate: number;
  } | null;
  production: {
    totalCount: number;
    completedCount: number;
    stages: Array<{ stage: string; count: number }>;
  };
  categorySales: Array<{
    category: string;
    total: number;
    estimatedMargin: number;
    marginPercent: number;
  }>;
  productPerformance: Array<{
    productId: string;
    productName: string;
    category: string;
    orderCount: number;
    quantitySold: number;
    salesTotal: number;
    averageUnitPrice: number;
    currentUnitCost: number;
    estimatedMargin: number;
    marginPerUnit: number;
    marginPercent: number;
  }>;
  recentOrders: OrderRecord[];
  urgentOrBlockedOrders: OrderRecord[];
  lowStockItems: Array<{
    id: string;
    name: string;
    category: string;
    quantity: number;
    minimumQuantity: number;
    unit: string;
    status: "Rupture" | "Critique" | "Stock faible";
  }>;
}

export const dashboardApi = {
  summary: (accessToken: string, period: DashboardPeriod) =>
    apiRequest<DashboardData>("/dashboard?period=" + period, {
      headers: withBearer(accessToken),
    }),
};
