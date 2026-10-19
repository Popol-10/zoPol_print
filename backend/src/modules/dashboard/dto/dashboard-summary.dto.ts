import { ApiProperty } from '@nestjs/swagger';
import { OrderSummaryDto } from '../../orders/dto/order-summary.dto';
import { ProductionTaskStage } from '../../production/entities/production-task-stage.enum';

export class DashboardMonthlyDto {
  month: string;
  label: string;
  income: number;
  expenses: number;
}

export class DashboardFinanceDto {
  income: number;
  expenses: number;
  netResult: number;

  @ApiProperty({ type: DashboardMonthlyDto, isArray: true })
  monthly: DashboardMonthlyDto[];
}

export class DashboardSalesDto {
  orderCount: number;
  totalSales: number;
  estimatedMargin: number;
  marginPercent: number;
}

export class DashboardCategorySalesDto {
  category: string;
  total: number;
  estimatedMargin: number;
  marginPercent: number;
}

export class DashboardProductPerformanceDto {
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
}

export class DashboardStockItemDto {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minimumQuantity: number;
  unit: string;
  status: string;
}

export class DashboardStockSummaryDto {
  itemCount: number;
  inventoryValue: number;
}

export class DashboardPeopleSummaryDto {
  activeEmployeeCount: number;
  recordedTodayCount: number;
  presentTodayCount: number;
  attendanceRate: number;
}

export class DashboardProductionStageDto {
  stage: ProductionTaskStage;
  count: number;
}

export class DashboardProductionDto {
  totalCount: number;
  completedCount: number;

  @ApiProperty({ type: DashboardProductionStageDto, isArray: true })
  stages: DashboardProductionStageDto[];
}

export class DashboardSummaryDto {
  period: string;
  periodStart: string;
  periodEnd: string;

  @ApiProperty({ type: DashboardFinanceDto, nullable: true })
  finance: DashboardFinanceDto | null;

  @ApiProperty({ type: DashboardSalesDto })
  sales: DashboardSalesDto;
  activeOrderCount: number;
  dueTodayCount: number;
  criticalStockCount: number;
  @ApiProperty({ type: DashboardStockSummaryDto })
  stock: DashboardStockSummaryDto;
  @ApiProperty({ type: DashboardProductionDto })
  production: DashboardProductionDto;

  @ApiProperty({ type: DashboardPeopleSummaryDto, nullable: true })
  people: DashboardPeopleSummaryDto | null;

  @ApiProperty({ type: DashboardCategorySalesDto, isArray: true })
  categorySales: DashboardCategorySalesDto[];

  @ApiProperty({ type: DashboardProductPerformanceDto, isArray: true })
  productPerformance: DashboardProductPerformanceDto[];

  @ApiProperty({ type: OrderSummaryDto, isArray: true })
  recentOrders: OrderSummaryDto[];

  @ApiProperty({ type: OrderSummaryDto, isArray: true })
  urgentOrBlockedOrders: OrderSummaryDto[];

  @ApiProperty({ type: DashboardStockItemDto, isArray: true })
  lowStockItems: DashboardStockItemDto[];
}
