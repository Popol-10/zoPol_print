import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AttendanceRecord } from '../attendance/entities/attendance-record.entity';
import { AttendanceStatus } from '../attendance/entities/attendance-status.enum';
import { Employee } from '../employees/entities/employee.entity';
import { EmployeeStatus } from '../employees/entities/employee-status.enum';
import { FinanceTransaction } from '../finance/entities/finance-transaction.entity';
import { FinanceTransactionType } from '../finance/entities/finance-transaction-type.enum';
import { OrderSummaryDto } from '../orders/dto/order-summary.dto';
import { OrderPriority } from '../orders/entities/order-priority.enum';
import { SalesOrder } from '../orders/entities/sales-order.entity';
import { OrderStatus } from '../orders/entities/order-status.enum';
import { ProductCategory } from '../products/entities/product-category.enum';
import { ProductionTask } from '../production/entities/production-task.entity';
import { ProductionTaskStage } from '../production/entities/production-task-stage.enum';
import { StockItem } from '../stock/entities/stock-item.entity';
import { UserRole } from '../users/entities/user-role.enum';
import { DashboardPeriod } from './dto/dashboard-query.dto';
import {
  DashboardCategorySalesDto,
  DashboardFinanceDto,
  DashboardMonthlyDto,
  DashboardPeopleSummaryDto,
  DashboardProductPerformanceDto,
  DashboardProductionStageDto,
  DashboardStockItemDto,
  DashboardSummaryDto,
} from './dto/dashboard-summary.dto';

const closedOrderStatuses = [OrderStatus.DELIVERED, OrderStatus.COMPLETED, OrderStatus.CANCELLED];
const categoryLabels: Record<ProductCategory, string> = {
  [ProductCategory.DTF]: 'DTF',
  [ProductCategory.TEXTILE]: 'Textile',
  [ProductCategory.LASER]: 'Laser',
  [ProductCategory.ACRYLIC]: 'Acrylique',
  [ProductCategory.WOOD]: 'Bois',
  [ProductCategory.PERSONALIZATION]: 'Personnalisation',
  [ProductCategory.ACCESSORIES]: 'Accessoires',
};

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(SalesOrder)
    private readonly ordersRepository: Repository<SalesOrder>,
    @InjectRepository(StockItem)
    private readonly stockRepository: Repository<StockItem>,
    @InjectRepository(ProductionTask)
    private readonly productionRepository: Repository<ProductionTask>,
    @InjectRepository(FinanceTransaction)
    private readonly financeRepository: Repository<FinanceTransaction>,
    @InjectRepository(Employee)
    private readonly employeesRepository: Repository<Employee>,
    @InjectRepository(AttendanceRecord)
    private readonly attendanceRepository: Repository<AttendanceRecord>,
  ) {}

  async getSummary(actor: AuthenticatedUser, period: DashboardPeriod): Promise<DashboardSummaryDto> {
    const { start, today, endExclusive } = this.periodRange(period);
    const organizationId = actor.organizationId;
    const canViewFinance = actor.roles.some(
      (role) => role === UserRole.ADMIN || role === UserRole.ACCOUNTANT,
    );
    const canViewPeople = actor.roles.some((role) => role === UserRole.ADMIN || role === UserRole.HR_MANAGER);

    const [
      activeOrderCount,
      dueTodayCount,
      recentOrders,
      urgentOrBlockedOrders,
      sales,
      categorySales,
      productPerformance,
      lowStockItems,
      criticalStockCount,
      stock,
      production,
      finance,
      people,
    ] = await Promise.all([
      this.ordersRepository
        .createQueryBuilder('order')
        .where('order.organizationId = :organizationId', { organizationId })
        .andWhere('order.status NOT IN (:...closedStatuses)', { closedStatuses: closedOrderStatuses })
        .getCount(),
      this.ordersRepository
        .createQueryBuilder('order')
        .where('order.organizationId = :organizationId', { organizationId })
        .andWhere('order.dueDate = :today', { today })
        .andWhere('order.status NOT IN (:...closedStatuses)', { closedStatuses: closedOrderStatuses })
        .getCount(),
      this.ordersRepository.find({
        where: { organizationId },
        order: { orderedAt: 'DESC', createdAt: 'DESC' },
        take: 5,
      }),
      this.ordersRepository
        .createQueryBuilder('order')
        .where('order.organizationId = :organizationId', { organizationId })
        .andWhere('order.status <> :cancelled', { cancelled: OrderStatus.CANCELLED })
        .andWhere('(order.status = :blocked OR order.priority = :urgent)', {
          blocked: OrderStatus.BLOCKED,
          urgent: OrderPriority.URGENT,
        })
        .orderBy('order.dueDate', 'ASC')
        .addOrderBy('order.orderedAt', 'ASC')
        .take(4)
        .getMany(),
      this.getSalesSummary(organizationId, start, endExclusive),
      this.getCategorySales(organizationId, start, endExclusive),
      this.getProductPerformance(organizationId, start, endExclusive),
      this.getLowStockItems(organizationId),
      this.stockRepository
        .createQueryBuilder('item')
        .where('item.organizationId = :organizationId', { organizationId })
        .andWhere('(item.quantity = 0 OR item.quantity <= item.minimumQuantity)')
        .getCount(),
      this.getStockSummary(organizationId),
      this.getProductionSummary(organizationId, start, endExclusive),
      canViewFinance ? this.getFinanceSummary(organizationId, start, today) : Promise.resolve(null),
      canViewPeople ? this.getPeopleSummary(organizationId, today) : Promise.resolve(null),
    ]);

    return {
      period,
      periodStart: start,
      periodEnd: today,
      finance,
      sales,
      activeOrderCount,
      dueTodayCount,
      criticalStockCount,
      stock,
      production,
      people,
      categorySales,
      productPerformance,
      recentOrders: recentOrders.map((order) => this.toOrderSummary(order)),
      urgentOrBlockedOrders: urgentOrBlockedOrders.map((order) => this.toOrderSummary(order)),
      lowStockItems,
    };
  }

  private async getSalesSummary(organizationId: string, start: string, endExclusive: string) {
    const row = await this.ordersRepository
      .createQueryBuilder('order')
      .innerJoin('order.product', 'product')
      .withDeleted()
      .select('COUNT(DISTINCT order.id)', 'orderCount')
      .addSelect('COALESCE(SUM(order.total), 0)', 'totalSales')
      .addSelect('COALESCE(SUM(order.total - order.quantity * product.cost), 0)', 'estimatedMargin')
      .where('order.organizationId = :organizationId', { organizationId })
      .andWhere('order.orderedAt >= :start', { start })
      .andWhere('order.orderedAt < :endExclusive', { endExclusive })
      .andWhere('order.status <> :cancelled', { cancelled: OrderStatus.CANCELLED })
      .getRawOne<{
        orderCount: string | number;
        totalSales: string | number;
        estimatedMargin: string | number;
      }>();

    const totalSales = Number(row?.totalSales ?? 0);
    const estimatedMargin = Number(row?.estimatedMargin ?? 0);
    return {
      orderCount: Number(row?.orderCount ?? 0),
      totalSales,
      estimatedMargin,
      marginPercent: totalSales > 0 ? (estimatedMargin / totalSales) * 100 : 0,
    };
  }

  private async getCategorySales(
    organizationId: string,
    start: string,
    endExclusive: string,
  ): Promise<DashboardCategorySalesDto[]> {
    const rows = await this.ordersRepository
      .createQueryBuilder('order')
      .innerJoin('order.product', 'product')
      .withDeleted()
      .select('product.category', 'category')
      .addSelect('SUM(order.total)', 'total')
      .addSelect('SUM(order.total - order.quantity * product.cost)', 'estimatedMargin')
      .where('order.organizationId = :organizationId', { organizationId })
      .andWhere('order.orderedAt >= :start', { start })
      .andWhere('order.orderedAt < :endExclusive', { endExclusive })
      .andWhere('order.status <> :cancelled', { cancelled: OrderStatus.CANCELLED })
      .groupBy('product.category')
      .getRawMany<{
        category: ProductCategory;
        total: string | number;
        estimatedMargin: string | number;
      }>();

    return rows
      .map((row) => {
        const total = Number(row.total);
        const estimatedMargin = Number(row.estimatedMargin);
        return {
          category: categoryLabels[row.category] ?? row.category,
          total,
          estimatedMargin,
          marginPercent: total > 0 ? (estimatedMargin / total) * 100 : 0,
        };
      })
      .sort((left, right) => right.total - left.total);
  }

  private async getProductPerformance(
    organizationId: string,
    start: string,
    endExclusive: string,
  ): Promise<DashboardProductPerformanceDto[]> {
    const rows = await this.ordersRepository
      .createQueryBuilder('order')
      .innerJoin('order.product', 'product')
      .withDeleted()
      .select('order.productId', 'productId')
      .addSelect('MAX(order.productName)', 'productName')
      .addSelect('product.category', 'category')
      .addSelect('COUNT(DISTINCT order.id)', 'orderCount')
      .addSelect('SUM(order.quantity)', 'quantitySold')
      .addSelect('SUM(order.total)', 'salesTotal')
      .addSelect('AVG(order.unitPrice)', 'averageUnitPrice')
      .addSelect('product.cost', 'currentUnitCost')
      .addSelect('SUM(order.total - order.quantity * product.cost)', 'estimatedMargin')
      .where('order.organizationId = :organizationId', { organizationId })
      .andWhere('order.orderedAt >= :start', { start })
      .andWhere('order.orderedAt < :endExclusive', { endExclusive })
      .andWhere('order.status <> :cancelled', { cancelled: OrderStatus.CANCELLED })
      .groupBy('order.productId')
      .addGroupBy('product.category')
      .addGroupBy('product.cost')
      .orderBy('quantitySold', 'DESC')
      .addOrderBy('salesTotal', 'DESC')
      .take(8)
      .getRawMany<{
        productId: string;
        productName: string;
        category: ProductCategory;
        orderCount: string | number;
        quantitySold: string | number;
        salesTotal: string | number;
        averageUnitPrice: string | number;
        currentUnitCost: string | number;
        estimatedMargin: string | number;
      }>();

    return rows.map((row) => {
      const salesTotal = Number(row.salesTotal);
      const estimatedMargin = Number(row.estimatedMargin);
      const averageUnitPrice = Number(row.averageUnitPrice);
      const currentUnitCost = Number(row.currentUnitCost);
      const quantitySold = Number(row.quantitySold);
      return {
        productId: row.productId,
        productName: row.productName,
        category: categoryLabels[row.category] ?? row.category,
        orderCount: Number(row.orderCount),
        quantitySold,
        salesTotal,
        averageUnitPrice,
        currentUnitCost,
        estimatedMargin,
        marginPerUnit: quantitySold > 0 ? estimatedMargin / quantitySold : averageUnitPrice - currentUnitCost,
        marginPercent: salesTotal > 0 ? (estimatedMargin / salesTotal) * 100 : 0,
      };
    });
  }

  private async getStockSummary(organizationId: string) {
    const row = await this.stockRepository
      .createQueryBuilder('item')
      .select('COUNT(*)', 'itemCount')
      .addSelect('COALESCE(SUM(item.quantity * item.unitCost), 0)', 'inventoryValue')
      .where('item.organizationId = :organizationId', { organizationId })
      .getRawOne<{ itemCount: string | number; inventoryValue: string | number }>();

    return {
      itemCount: Number(row?.itemCount ?? 0),
      inventoryValue: Number(row?.inventoryValue ?? 0),
    };
  }

  private async getPeopleSummary(organizationId: string, today: string): Promise<DashboardPeopleSummaryDto> {
    const [activeEmployeeCount, attendance] = await Promise.all([
      this.employeesRepository.count({
        where: { organizationId, status: EmployeeStatus.ACTIVE },
      }),
      this.attendanceRepository
        .createQueryBuilder('attendance')
        .innerJoin('attendance.employee', 'employee')
        .select('COUNT(*)', 'recordedCount')
        .addSelect(
          'SUM(CASE WHEN attendance.status IN (:...presentStatuses) THEN 1 ELSE 0 END)',
          'presentCount',
        )
        .where('attendance.organizationId = :organizationId', { organizationId })
        .andWhere('attendance.attendanceDate = :today', { today })
        .andWhere('employee.status = :active', { active: EmployeeStatus.ACTIVE })
        .setParameter('presentStatuses', [AttendanceStatus.PRESENT, AttendanceStatus.LATE])
        .getRawOne<{ recordedCount: string | number; presentCount: string | number }>(),
    ]);
    const recordedTodayCount = Number(attendance?.recordedCount ?? 0);
    const presentTodayCount = Number(attendance?.presentCount ?? 0);

    return {
      activeEmployeeCount,
      recordedTodayCount,
      presentTodayCount,
      attendanceRate: recordedTodayCount > 0 ? (presentTodayCount / recordedTodayCount) * 100 : 0,
    };
  }

  private async getProductionSummary(organizationId: string, start: string, endExclusive: string) {
    const rows = await this.productionRepository
      .createQueryBuilder('task')
      .innerJoin('task.order', 'order')
      .select('task.stage', 'stage')
      .addSelect('COUNT(*)', 'count')
      .where('task.organizationId = :organizationId', { organizationId })
      .andWhere('order.orderedAt >= :start', { start })
      .andWhere('order.orderedAt < :endExclusive', { endExclusive })
      .andWhere('order.status <> :cancelled', { cancelled: OrderStatus.CANCELLED })
      .groupBy('task.stage')
      .getRawMany<{ stage: ProductionTaskStage; count: string | number }>();
    const counts = new Map(rows.map((row) => [row.stage, Number(row.count)]));
    const stages: DashboardProductionStageDto[] = Object.values(ProductionTaskStage).map((stage) => ({
      stage,
      count: counts.get(stage) ?? 0,
    }));
    const totalCount = stages.reduce((sum, stage) => sum + stage.count, 0);
    return {
      totalCount,
      completedCount: counts.get(ProductionTaskStage.COMPLETED) ?? 0,
      stages,
    };
  }

  private async getFinanceSummary(
    organizationId: string,
    start: string,
    end: string,
  ): Promise<DashboardFinanceDto> {
    const totals = await this.financeRepository
      .createQueryBuilder('transaction')
      .select(
        'COALESCE(SUM(CASE WHEN transaction.type = :income THEN transaction.amount ELSE 0 END), 0)',
        'income',
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN transaction.type = :expense THEN transaction.amount ELSE 0 END), 0)',
        'expenses',
      )
      .where('transaction.organizationId = :organizationId', { organizationId })
      .andWhere('transaction.transactionDate BETWEEN :start AND :end', { start, end })
      .setParameters({ income: FinanceTransactionType.INCOME, expense: FinanceTransactionType.EXPENSE })
      .getRawOne<{ income: string | number; expenses: string | number }>();

    const monthly = await this.getMonthlyFinance(organizationId);
    const income = Number(totals?.income ?? 0);
    const expenses = Number(totals?.expenses ?? 0);
    return { income, expenses, netResult: income - expenses, monthly };
  }

  private async getMonthlyFinance(organizationId: string): Promise<DashboardMonthlyDto[]> {
    const now = new Date();
    const firstMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const firstMonthValue = this.dateValue(firstMonth);
    const nextMonthValue = this.dateValue(nextMonth);
    const rows = await this.financeRepository
      .createQueryBuilder('transaction')
      .select("DATE_FORMAT(transaction.transactionDate, '%Y-%m')", 'month')
      .addSelect(
        'COALESCE(SUM(CASE WHEN transaction.type = :income THEN transaction.amount ELSE 0 END), 0)',
        'income',
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN transaction.type = :expense THEN transaction.amount ELSE 0 END), 0)',
        'expenses',
      )
      .where('transaction.organizationId = :organizationId', { organizationId })
      .andWhere('transaction.transactionDate >= :firstMonth', { firstMonth: firstMonthValue })
      .andWhere('transaction.transactionDate < :nextMonth', { nextMonth: nextMonthValue })
      .setParameters({ income: FinanceTransactionType.INCOME, expense: FinanceTransactionType.EXPENSE })
      .groupBy("DATE_FORMAT(transaction.transactionDate, '%Y-%m')")
      .getRawMany<{ month: string; income: string | number; expenses: string | number }>();

    const byMonth = new Map(rows.map((row) => [row.month, row]));
    return Array.from({ length: 6 }, (_, offset) => {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + offset, 1));
      const month = this.dateValue(date).slice(0, 7);
      const row = byMonth.get(month);
      return {
        month,
        label: new Intl.DateTimeFormat('fr-FR', { month: 'short', timeZone: 'UTC' }).format(date),
        income: Number(row?.income ?? 0),
        expenses: Number(row?.expenses ?? 0),
      };
    });
  }

  private async getLowStockItems(organizationId: string): Promise<DashboardStockItemDto[]> {
    const items = await this.stockRepository
      .createQueryBuilder('item')
      .where('item.organizationId = :organizationId', { organizationId })
      .andWhere('(item.quantity = 0 OR item.quantity <= item.minimumQuantity)')
      .orderBy('item.quantity', 'ASC')
      .addOrderBy('item.name', 'ASC')
      .getMany();

    return items.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      minimumQuantity: item.minimumQuantity,
      unit: item.unit,
      status:
        item.quantity === 0
          ? 'Rupture'
          : item.quantity <= item.minimumQuantity / 2
            ? 'Critique'
            : 'Stock faible',
    }));
  }

  private toOrderSummary(order: SalesOrder): OrderSummaryDto {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      clientId: order.clientId,
      clientName: order.clientName,
      clientCompany: order.clientCompany,
      productId: order.productId,
      productName: order.productName,
      productReference: order.productReference,
      machine: order.machine,
      quantity: order.quantity,
      unitPrice: Number(order.unitPrice),
      total: Number(order.total),
      paidAmount: Number(order.paidAmount),
      status: order.status,
      priority: order.priority,
      orderedAt: order.orderedAt,
      dueDate: order.dueDate,
      operatorName: order.operatorName,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  private periodRange(period: DashboardPeriod): {
    start: string;
    today: string;
    endExclusive: string;
  } {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const startMonth = period === 'year' ? 0 : period === 'quarter' ? Math.floor(month / 3) * 3 : month;
    const start = this.dateValue(new Date(Date.UTC(year, startMonth, 1)));
    const today = this.dateValue(now);
    const endDate = new Date(today + 'T00:00:00.000Z');
    endDate.setUTCDate(endDate.getUTCDate() + 1);
    return { start, today, endExclusive: this.dateValue(endDate) };
  }

  private dateValue(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
