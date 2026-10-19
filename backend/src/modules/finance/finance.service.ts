import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, EntityManager, Not, Repository } from 'typeorm';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AuditService } from '../audit/audit.service';
import { AuditEvent } from '../audit/entities/audit-event.enum';
import { CreateFinanceTransactionDto } from './dto/create-finance-transaction.dto';
import { CreateFinanceOrderPaymentDto } from './dto/create-finance-order-payment.dto';
import { CreateFinanceTransferDto } from './dto/create-finance-transfer.dto';
import { FinanceTransferSummaryDto } from './dto/finance-transfer-summary.dto';
import { CreateBankReconciliationDto } from './dto/create-bank-reconciliation.dto';
import { BankReconciliationDetailDto } from './dto/bank-reconciliation-detail.dto';
import { BankReconciliationSummaryDto } from './dto/bank-reconciliation-summary.dto';
import { FinanceMonthSummaryDto } from './dto/finance-month-summary.dto';
import { FinanceSummaryDto } from './dto/finance-summary.dto';
import { FinanceTransactionPageDto } from './dto/finance-transaction-page.dto';
import { FinanceTransactionQueryDto } from './dto/finance-transaction-query.dto';
import { FinanceTransactionSummaryDto } from './dto/finance-transaction-summary.dto';
import { FinanceAccountMethod } from './entities/finance-account-method.enum';
import { FinanceTransactionCategory } from './entities/finance-transaction-category.enum';
import { FinanceTransaction } from './entities/finance-transaction.entity';
import { FinanceTransactionType } from './entities/finance-transaction-type.enum';
import { BankReconciliation } from './entities/bank-reconciliation.entity';
import { BankReconciliationStatus } from './entities/bank-reconciliation-status.enum';
import { Organization } from '../organizations/entities/organization.entity';
import { SalesOrder } from '../orders/entities/sales-order.entity';
import { OrderSummaryDto } from '../orders/dto/order-summary.dto';

const incomeCategories = [FinanceTransactionCategory.SALES, FinanceTransactionCategory.OTHER_INCOME];
const accountLabels: Record<FinanceAccountMethod, string> = {
  [FinanceAccountMethod.CASH]: 'Caisse',
  [FinanceAccountMethod.BANK]: 'Banque',
  [FinanceAccountMethod.MOBILE_MONEY]: 'Mobile Money',
};

const expenseCategories = [
  FinanceTransactionCategory.GENERAL_EXPENSE,
  FinanceTransactionCategory.INTERNAL_PURCHASE,
  FinanceTransactionCategory.LOGISTICS,
  FinanceTransactionCategory.MAINTENANCE,
  FinanceTransactionCategory.OTHER_EXPENSE,
];

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(FinanceTransaction)
    private readonly transactionsRepository: Repository<FinanceTransaction>,
    private readonly auditService: AuditService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async findTransactions(
    organizationId: string,
    query: FinanceTransactionQueryDto,
  ): Promise<FinanceTransactionPageDto> {
    const builder = this.transactionsRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.order', 'order')
      .where('transaction.organizationId = :organizationId', { organizationId });
    if (query.type) builder.andWhere('transaction.type = :type', { type: query.type });
    if (query.method) builder.andWhere('transaction.method = :method', { method: query.method });
    if (query.search) {
      builder.andWhere(
        '(transaction.label LIKE :search OR transaction.category LIKE :search OR order.orderNumber LIKE :search)',
        {
          search: '%' + query.search + '%',
        },
      );
    }
    const total = await builder.clone().getCount();
    const pageSize = query.pageSize ?? 15;
    const page = query.page ?? 1;
    const items = await builder
      .orderBy('transaction.transactionDate', 'DESC')
      .addOrderBy('transaction.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();
    return {
      items: items.map((item) => this.toSummary(item)),
      total,
      page,
      pageSize,
    };
  }

  async summary(organizationId: string): Promise<FinanceSummaryDto> {
    const totals = await this.transactionsRepository
      .createQueryBuilder('transaction')
      .select(
        'COALESCE(SUM(CASE WHEN transaction.type = :income THEN transaction.amount ELSE 0 END), 0)',
        'totalIncome',
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN transaction.type = :expense THEN transaction.amount ELSE 0 END), 0)',
        'totalExpenses',
      )
      .setParameters({
        income: FinanceTransactionType.INCOME,
        expense: FinanceTransactionType.EXPENSE,
        organizationId,
      })
      .where('transaction.organizationId = :organizationId')
      .getRawOne<{ totalIncome: string | number; totalExpenses: string | number }>();

    const accounts = await this.transactionsRepository
      .createQueryBuilder('transaction')
      .select('transaction.method', 'method')
      .addSelect(
        'COALESCE(SUM(CASE WHEN transaction.type IN (:expense, :transferOut) THEN -transaction.amount ELSE transaction.amount END), 0)',
        'balance',
      )
      .where('transaction.organizationId = :organizationId', { organizationId })
      .setParameters({
        expense: FinanceTransactionType.EXPENSE,
        transferOut: FinanceTransactionType.TRANSFER_OUT,
      })
      .groupBy('transaction.method')
      .getRawMany<{ method: FinanceAccountMethod; balance: string | number }>();

    const now = new Date();
    const firstMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const firstMonthValue = this.dateValue(firstMonth);
    const nextMonthValue = this.dateValue(nextMonth);
    const monthRows = await this.transactionsRepository
      .createQueryBuilder('transaction')
      .select("DATE_FORMAT(transaction.transactionDate, '%Y-%m')", 'month')
      .addSelect(
        'COALESCE(SUM(CASE WHEN transaction.type = :income THEN transaction.amount ELSE 0 END), 0)',
        'income',
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN transaction.type = :expense THEN transaction.amount ELSE 0 END), 0)',
        'expense',
      )
      .where('transaction.organizationId = :organizationId', { organizationId })
      .andWhere('transaction.transactionDate >= :firstMonth', { firstMonth: firstMonthValue })
      .andWhere('transaction.transactionDate < :nextMonth', { nextMonth: nextMonthValue })
      .setParameters({
        income: FinanceTransactionType.INCOME,
        expense: FinanceTransactionType.EXPENSE,
      })
      .groupBy("DATE_FORMAT(transaction.transactionDate, '%Y-%m')")
      .getRawMany<{ month: string; income: string | number; expense: string | number }>();

    const amountByMonth = new Map(
      monthRows.map((row) => [row.month, { income: Number(row.income), expense: Number(row.expense) }]),
    );
    const monthly: FinanceMonthSummaryDto[] = [];
    for (let offset = 0; offset < 6; offset += 1) {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + offset, 1));
      const month = this.dateValue(date).slice(0, 7);
      const values = amountByMonth.get(month) ?? { income: 0, expense: 0 };
      monthly.push({
        month,
        label: new Intl.DateTimeFormat('fr-FR', { month: 'short', timeZone: 'UTC' }).format(date),
        ...values,
      });
    }

    const cashBalance = this.balanceFor(accounts, FinanceAccountMethod.CASH);
    const bankBalance = this.balanceFor(accounts, FinanceAccountMethod.BANK);
    const mobileMoneyBalance = this.balanceFor(accounts, FinanceAccountMethod.MOBILE_MONEY);
    return {
      totalIncome: Number(totals?.totalIncome ?? 0),
      totalExpenses: Number(totals?.totalExpenses ?? 0),
      cashBalance,
      bankBalance,
      mobileMoneyBalance,
      totalBalance: cashBalance + bankBalance + mobileMoneyBalance,
      monthly,
    };
  }

  async create(
    actor: AuthenticatedUser,
    dto: CreateFinanceTransactionDto,
  ): Promise<FinanceTransactionSummaryDto> {
    if (dto.type === FinanceTransactionType.TRANSFER_IN || dto.type === FinanceTransactionType.TRANSFER_OUT) {
      throw new BadRequestException('Utilisez la route dédiée pour transférer des fonds entre comptes.');
    }
    let category: FinanceTransactionCategory;
    if (dto.type === FinanceTransactionType.OPENING_BALANCE) {
      if (dto.category) throw new BadRequestException('Un solde initial ne prend pas de catégorie.');
      category = FinanceTransactionCategory.OPENING_BALANCE;
    } else if (dto.type === FinanceTransactionType.INCOME) {
      if (!dto.category || !incomeCategories.includes(dto.category)) {
        throw new BadRequestException('Choisissez une catégorie de revenu valide.');
      }
      category = dto.category;
    } else {
      if (!dto.category || !expenseCategories.includes(dto.category)) {
        throw new BadRequestException('Choisissez une catégorie de dépense valide.');
      }
      category = dto.category;
    }

    const transaction = await this.dataSource.transaction(async (manager) => {
      if (dto.method === FinanceAccountMethod.BANK) {
        await this.assertBankPeriodCanAccept(manager, actor.organizationId, dto.transactionDate);
      }
      const repository = manager.getRepository(FinanceTransaction);
      const saved = await repository.save(
        repository.create({
          organizationId: actor.organizationId,
          type: dto.type,
          label: dto.label,
          category,
          method: dto.method,
          amount: dto.amount,
          transactionDate: dto.transactionDate,
          orderId: null,
          transferId: null,
          reconciliationId: null,
        }),
      );
      await this.auditService.record({
        organizationId: actor.organizationId,
        actorId: actor.id,
        event: AuditEvent.FINANCE_TRANSACTION_CREATED,
        entityType: 'FINANCE_TRANSACTION',
        entityId: saved.id,
        metadata: {
          type: saved.type,
          category: saved.category,
          method: saved.method,
          amount: saved.amount,
          transactionDate: saved.transactionDate,
        },
        manager,
      });
      return saved;
    });
    return this.toSummary(transaction);
  }

  async createTransfer(
    actor: AuthenticatedUser,
    dto: CreateFinanceTransferDto,
  ): Promise<FinanceTransferSummaryDto> {
    if (dto.sourceMethod === dto.destinationMethod) {
      throw new BadRequestException('Les comptes source et destinataire doivent être différents.');
    }

    const transferId = randomUUID();
    const label = dto.label
      ? `Virement ${accountLabels[dto.sourceMethod]} → ${accountLabels[dto.destinationMethod]} · ${dto.label}`
      : `Virement ${accountLabels[dto.sourceMethod]} → ${accountLabels[dto.destinationMethod]}`;

    await this.dataSource.transaction(async (manager) => {
      if (
        dto.sourceMethod === FinanceAccountMethod.BANK ||
        dto.destinationMethod === FinanceAccountMethod.BANK
      ) {
        await this.assertBankPeriodCanAccept(manager, actor.organizationId, dto.transactionDate);
      }
      const transactions = manager.getRepository(FinanceTransaction);
      await transactions.save(
        transactions.create({
          organizationId: actor.organizationId,
          orderId: null,
          transferId,
          type: FinanceTransactionType.TRANSFER_OUT,
          label,
          category: FinanceTransactionCategory.ACCOUNT_TRANSFER,
          method: dto.sourceMethod,
          amount: dto.amount,
          transactionDate: dto.transactionDate,
        }),
      );
      await transactions.save(
        transactions.create({
          organizationId: actor.organizationId,
          orderId: null,
          transferId,
          type: FinanceTransactionType.TRANSFER_IN,
          label,
          category: FinanceTransactionCategory.ACCOUNT_TRANSFER,
          method: dto.destinationMethod,
          amount: dto.amount,
          transactionDate: dto.transactionDate,
        }),
      );
      await this.auditService.record({
        organizationId: actor.organizationId,
        actorId: actor.id,
        event: AuditEvent.FINANCE_TRANSFER_CREATED,
        entityType: 'FINANCE_TRANSFER',
        entityId: transferId,
        metadata: {
          sourceMethod: dto.sourceMethod,
          destinationMethod: dto.destinationMethod,
          amount: dto.amount,
          transactionDate: dto.transactionDate,
          label: dto.label ?? null,
        },
        manager,
      });
    });

    return {
      id: transferId,
      sourceMethod: dto.sourceMethod,
      destinationMethod: dto.destinationMethod,
      amount: dto.amount,
      label,
      transactionDate: dto.transactionDate,
    };
  }

  async receiveOrderPayment(
    actor: AuthenticatedUser,
    orderId: string,
    dto: CreateFinanceOrderPaymentDto,
  ): Promise<OrderSummaryDto> {
    const result = await this.dataSource.transaction(async (manager) => {
      const orders = manager.getRepository(SalesOrder);
      const transactions = manager.getRepository(FinanceTransaction);
      const order = await orders.findOne({
        where: { id: orderId, organizationId: actor.organizationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) throw new NotFoundException('Commande introuvable.');
      if (dto.method === FinanceAccountMethod.BANK) {
        await this.assertBankPeriodCanAccept(manager, actor.organizationId, dto.transactionDate);
      }

      const outstanding = Number((Number(order.total) - Number(order.paidAmount)).toFixed(2));
      if (outstanding <= 0) throw new BadRequestException('Cette commande est déjà réglée.');
      if (dto.amount > outstanding) {
        throw new BadRequestException('Le paiement dépasse le reste à payer de la commande.');
      }

      const transaction = await transactions.save(
        transactions.create({
          organizationId: actor.organizationId,
          orderId: order.id,
          order,
          type: FinanceTransactionType.INCOME,
          label: `Paiement ${order.orderNumber}`,
          category: FinanceTransactionCategory.CLIENT_DEPOSIT,
          method: dto.method,
          amount: dto.amount,
          transactionDate: dto.transactionDate,
        }),
      );
      order.paidAmount = Number((Number(order.paidAmount) + dto.amount).toFixed(2));
      const updatedOrder = await orders.save(order);
      await this.auditService.record({
        organizationId: actor.organizationId,
        actorId: actor.id,
        event: AuditEvent.FINANCE_ORDER_PAYMENT_RECEIVED,
        entityType: 'FINANCE_TRANSACTION',
        entityId: transaction.id,
        metadata: {
          orderId: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          amount: transaction.amount,
          method: transaction.method,
          transactionDate: transaction.transactionDate,
        },
        manager,
      });
      return updatedOrder;
    });
    return this.toOrderSummary(result);
  }

  async listBankReconciliations(organizationId: string): Promise<BankReconciliationSummaryDto[]> {
    const sessions = await this.dataSource.getRepository(BankReconciliation).find({
      where: { organizationId },
      order: { periodStart: 'DESC', createdAt: 'DESC' },
      take: 24,
    });
    return Promise.all(
      sessions.map(async (session) =>
        this.toReconciliationSummary(session, await this.reconciliationTransactions(session)),
      ),
    );
  }

  async getBankReconciliation(
    organizationId: string,
    reconciliationId: string,
  ): Promise<BankReconciliationDetailDto> {
    const session = await this.dataSource.getRepository(BankReconciliation).findOne({
      where: { id: reconciliationId, organizationId },
    });
    if (!session) throw new NotFoundException('Rapprochement bancaire introuvable.');
    const transactions = await this.reconciliationTransactions(session);
    return this.toReconciliationDetail(session, transactions);
  }

  async createBankReconciliation(
    actor: AuthenticatedUser,
    dto: CreateBankReconciliationDto,
  ): Promise<BankReconciliationDetailDto> {
    if (dto.periodStart > dto.periodEnd) {
      throw new BadRequestException('La date de début doit précéder ou égaler la date de fin.');
    }
    const session = await this.dataSource.transaction(async (manager) => {
      const organizations = manager.getRepository(Organization);
      const organization = await organizations.findOne({
        where: { id: actor.organizationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!organization) throw new NotFoundException('Organisation introuvable.');

      const reconciliations = manager.getRepository(BankReconciliation);
      const overlap = await reconciliations
        .createQueryBuilder('reconciliation')
        .where('reconciliation.organizationId = :organizationId', {
          organizationId: actor.organizationId,
        })
        .andWhere('reconciliation.status <> :cancelled', {
          cancelled: BankReconciliationStatus.CANCELLED,
        })
        .andWhere('reconciliation.periodStart <= :periodEnd', {
          periodEnd: dto.periodEnd,
        })
        .andWhere('reconciliation.periodEnd >= :periodStart', {
          periodStart: dto.periodStart,
        })
        .getOne();
      if (overlap) {
        throw new BadRequestException('Cette période chevauche un rapprochement déjà ouvert ou terminé.');
      }

      const created = await reconciliations.save(
        reconciliations.create({
          organizationId: actor.organizationId,
          periodStart: dto.periodStart,
          periodEnd: dto.periodEnd,
          statementOpeningBalance: dto.statementOpeningBalance,
          statementClosingBalance: dto.statementClosingBalance,
          status: BankReconciliationStatus.OPEN,
          completedAt: null,
        }),
      );
      await this.auditService.record({
        organizationId: actor.organizationId,
        actorId: actor.id,
        event: AuditEvent.BANK_RECONCILIATION_CREATED,
        entityType: 'BANK_RECONCILIATION',
        entityId: created.id,
        metadata: {
          periodStart: created.periodStart,
          periodEnd: created.periodEnd,
          statementOpeningBalance: created.statementOpeningBalance,
          statementClosingBalance: created.statementClosingBalance,
        },
        manager,
      });
      return created;
    });
    return this.getBankReconciliation(actor.organizationId, session.id);
  }

  async setBankReconciliationMatch(
    actor: AuthenticatedUser,
    reconciliationId: string,
    transactionId: string,
    matched: boolean,
  ): Promise<BankReconciliationDetailDto> {
    await this.dataSource.transaction(async (manager) => {
      const reconciliations = manager.getRepository(BankReconciliation);
      const session = await reconciliations.findOne({
        where: { id: reconciliationId, organizationId: actor.organizationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!session) throw new NotFoundException('Rapprochement bancaire introuvable.');
      if (session.status !== BankReconciliationStatus.OPEN) {
        throw new BadRequestException('Seul un rapprochement ouvert peut être modifié.');
      }

      const transactions = manager.getRepository(FinanceTransaction);
      const transaction = await transactions.findOne({
        where: {
          id: transactionId,
          organizationId: actor.organizationId,
          method: FinanceAccountMethod.BANK,
          type: Not(FinanceTransactionType.OPENING_BALANCE),
          transactionDate: Between(session.periodStart, session.periodEnd),
        },
        lock: { mode: 'pessimistic_write' },
      });
      if (!transaction) {
        throw new NotFoundException('Mouvement bancaire hors période ou introuvable.');
      }

      if (matched) {
        if (transaction.reconciliationId && transaction.reconciliationId !== session.id) {
          throw new BadRequestException('Ce mouvement appartient déjà à un autre rapprochement.');
        }
        if (transaction.reconciliationId === session.id) return;
        transaction.reconciliationId = session.id;
      } else {
        if (transaction.reconciliationId !== session.id) {
          throw new BadRequestException('Ce mouvement n’est pas marqué dans ce rapprochement.');
        }
        transaction.reconciliationId = null;
      }
      await transactions.save(transaction);
      await this.auditService.record({
        organizationId: actor.organizationId,
        actorId: actor.id,
        event: matched ? AuditEvent.BANK_RECONCILIATION_MATCHED : AuditEvent.BANK_RECONCILIATION_UNMATCHED,
        entityType: 'FINANCE_TRANSACTION',
        entityId: transaction.id,
        metadata: { reconciliationId: session.id },
        manager,
      });
    });
    return this.getBankReconciliation(actor.organizationId, reconciliationId);
  }

  async completeBankReconciliation(
    actor: AuthenticatedUser,
    reconciliationId: string,
  ): Promise<BankReconciliationDetailDto> {
    await this.dataSource.transaction(async (manager) => {
      const reconciliations = manager.getRepository(BankReconciliation);
      const session = await reconciliations.findOne({
        where: { id: reconciliationId, organizationId: actor.organizationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!session) throw new NotFoundException('Rapprochement bancaire introuvable.');
      if (session.status !== BankReconciliationStatus.OPEN) {
        throw new BadRequestException('Ce rapprochement n’est plus ouvert.');
      }

      const transactions = await manager.getRepository(FinanceTransaction).find({
        where: {
          organizationId: actor.organizationId,
          method: FinanceAccountMethod.BANK,
          type: Not(FinanceTransactionType.OPENING_BALANCE),
          transactionDate: Between(session.periodStart, session.periodEnd),
        },
        lock: { mode: 'pessimistic_write' },
      });
      const unmatchedCount = transactions.filter(
        (transaction) => transaction.reconciliationId !== session.id,
      ).length;
      if (unmatchedCount > 0) {
        throw new BadRequestException(
          `${unmatchedCount} mouvement(s) bancaire(s) doivent être pointés avec le relevé.`,
        );
      }
      const calculatedBalance = this.calculateStatementBalance(session, transactions);
      const difference = calculatedBalance - Number(session.statementClosingBalance);
      if (difference !== 0) {
        throw new BadRequestException(
          `Le solde calculé est ${calculatedBalance} Ar ; le relevé indique ${session.statementClosingBalance} Ar. Écart : ${difference} Ar.`,
        );
      }

      session.status = BankReconciliationStatus.RECONCILED;
      session.completedAt = new Date();
      await reconciliations.save(session);
      await this.auditService.record({
        organizationId: actor.organizationId,
        actorId: actor.id,
        event: AuditEvent.BANK_RECONCILIATION_COMPLETED,
        entityType: 'BANK_RECONCILIATION',
        entityId: session.id,
        metadata: {
          periodStart: session.periodStart,
          periodEnd: session.periodEnd,
          statementClosingBalance: session.statementClosingBalance,
          calculatedClosingBalance: calculatedBalance,
        },
        manager,
      });
    });
    return this.getBankReconciliation(actor.organizationId, reconciliationId);
  }

  async cancelBankReconciliation(
    actor: AuthenticatedUser,
    reconciliationId: string,
  ): Promise<BankReconciliationDetailDto> {
    await this.dataSource.transaction(async (manager) => {
      const reconciliations = manager.getRepository(BankReconciliation);
      const session = await reconciliations.findOne({
        where: { id: reconciliationId, organizationId: actor.organizationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!session) throw new NotFoundException('Rapprochement bancaire introuvable.');
      if (session.status !== BankReconciliationStatus.OPEN) {
        throw new BadRequestException('Seul un rapprochement ouvert peut être annulé.');
      }
      const matchedCount = await manager.getRepository(FinanceTransaction).count({
        where: { organizationId: actor.organizationId, reconciliationId: session.id },
      });
      if (matchedCount > 0) {
        throw new BadRequestException(
          'Retirez d’abord les mouvements pointés avant d’annuler ce rapprochement.',
        );
      }
      session.status = BankReconciliationStatus.CANCELLED;
      await reconciliations.save(session);
      await this.auditService.record({
        organizationId: actor.organizationId,
        actorId: actor.id,
        event: AuditEvent.BANK_RECONCILIATION_CANCELLED,
        entityType: 'BANK_RECONCILIATION',
        entityId: session.id,
        manager,
      });
    });
    return this.getBankReconciliation(actor.organizationId, reconciliationId);
  }

  private async assertBankPeriodCanAccept(
    manager: EntityManager,
    organizationId: string,
    transactionDate: string,
  ): Promise<void> {
    const session = await manager
      .getRepository(BankReconciliation)
      .createQueryBuilder('reconciliation')
      .where('reconciliation.organizationId = :organizationId', { organizationId })
      .andWhere('reconciliation.status <> :cancelled', {
        cancelled: BankReconciliationStatus.CANCELLED,
      })
      .andWhere(':transactionDate BETWEEN reconciliation.periodStart AND reconciliation.periodEnd', {
        transactionDate,
      })
      .setLock('pessimistic_write')
      .getOne();
    if (session?.status === BankReconciliationStatus.RECONCILED) {
      throw new BadRequestException(
        'La période bancaire est rapprochée ; saisissez une correction à la date courante.',
      );
    }
  }

  private async reconciliationTransactions(session: BankReconciliation): Promise<FinanceTransaction[]> {
    return this.dataSource.getRepository(FinanceTransaction).find({
      where: {
        organizationId: session.organizationId,
        method: FinanceAccountMethod.BANK,
        type: Not(FinanceTransactionType.OPENING_BALANCE),
        transactionDate: Between(session.periodStart, session.periodEnd),
      },
      relations: { order: true },
      order: { transactionDate: 'ASC', createdAt: 'ASC' },
    });
  }

  private calculateStatementBalance(session: BankReconciliation, transactions: FinanceTransaction[]): number {
    return transactions.reduce((balance, transaction) => {
      const amount = Number(transaction.amount);
      return (
        balance +
        (transaction.type === FinanceTransactionType.EXPENSE ||
        transaction.type === FinanceTransactionType.TRANSFER_OUT
          ? -amount
          : amount)
      );
    }, Number(session.statementOpeningBalance));
  }

  private toReconciliationSummary(
    session: BankReconciliation,
    transactions: FinanceTransaction[],
  ): BankReconciliationSummaryDto {
    const calculatedClosingBalance = this.calculateStatementBalance(session, transactions);
    return {
      id: session.id,
      periodStart: session.periodStart,
      periodEnd: session.periodEnd,
      statementOpeningBalance: Number(session.statementOpeningBalance),
      statementClosingBalance: Number(session.statementClosingBalance),
      calculatedClosingBalance,
      difference: calculatedClosingBalance - Number(session.statementClosingBalance),
      matchedCount: transactions.filter((transaction) => transaction.reconciliationId === session.id).length,
      transactionCount: transactions.length,
      status: session.status,
      createdAt: session.createdAt,
      completedAt: session.completedAt,
    };
  }

  private toReconciliationDetail(
    session: BankReconciliation,
    transactions: FinanceTransaction[],
  ): BankReconciliationDetailDto {
    return {
      ...this.toReconciliationSummary(session, transactions),
      transactions: transactions.map((transaction) => this.toSummary(transaction)),
    };
  }

  private balanceFor(
    balances: Array<{ method: FinanceAccountMethod; balance: string | number }>,
    method: FinanceAccountMethod,
  ): number {
    return Number(balances.find((row) => row.method === method)?.balance ?? 0);
  }

  private dateValue(date: Date): string {
    return date.toISOString().slice(0, 10);
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

  private toSummary(transaction: FinanceTransaction): FinanceTransactionSummaryDto {
    return {
      id: transaction.id,
      orderId: transaction.orderId ?? null,
      orderNumber: transaction.order?.orderNumber ?? null,
      transferId: transaction.transferId ?? null,
      reconciliationId: transaction.reconciliationId ?? null,
      type: transaction.type,
      label: transaction.label,
      category: transaction.category,
      method: transaction.method,
      amount: transaction.amount,
      transactionDate: transaction.transactionDate,
      createdAt: transaction.createdAt,
    };
  }
}
