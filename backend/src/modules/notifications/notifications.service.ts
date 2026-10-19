import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThanOrEqual, Not, Repository } from 'typeorm';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AuditEvent } from '../audit/entities/audit-event.enum';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { MachineMaintenance } from '../machines/entities/machine-maintenance.entity';
import { MaintenanceStatus } from '../machines/entities/maintenance-status.enum';
import { SalesOrder } from '../orders/entities/sales-order.entity';
import { OrderStatus } from '../orders/entities/order-status.enum';
import { Organization } from '../organizations/entities/organization.entity';
import { StockItem } from '../stock/entities/stock-item.entity';
import { UserRole } from '../users/entities/user-role.enum';
import { MarkNotificationsReadDto } from './dto/mark-notifications-read.dto';
import {
  NotificationPreferencesDto,
  UpdateNotificationPreferencesDto,
} from './dto/notification-preferences.dto';
import {
  NotificationListDto,
  NotificationReadResultDto,
  NotificationSummaryDto,
} from './dto/notification-summary.dto';
import { NotificationRead } from './entities/notification-read.entity';
import { NotificationPreferences } from './entities/notification-preferences.entity';

type NotificationScope =
  | 'organization'
  | 'commercial'
  | 'invoicing'
  | 'procurement'
  | 'stock'
  | 'warehouse'
  | 'production'
  | 'finance'
  | 'hr'
  | 'admin';

interface NotificationDefinition {
  title: string;
  fallbackDetail: string;
  route: string;
  scope: NotificationScope;
}

const notificationDefinitions: Partial<Record<AuditEvent, NotificationDefinition>> = {
  [AuditEvent.USER_CREATED]: {
    title: 'Nouveau membre',
    fallbackDetail: 'Un membre a été ajouté à l’organisation.',
    route: '/utilisateurs',
    scope: 'admin',
  },
  [AuditEvent.USER_ROLES_UPDATED]: {
    title: 'Rôles mis à jour',
    fallbackDetail: 'Les rôles d’un membre ont été modifiés.',
    route: '/utilisateurs',
    scope: 'admin',
  },
  [AuditEvent.CLIENT_CREATED]: {
    title: 'Nouveau client',
    fallbackDetail: 'Un client a été ajouté.',
    route: '/clients',
    scope: 'commercial',
  },
  [AuditEvent.CLIENT_UPDATED]: {
    title: 'Fiche client modifiée',
    fallbackDetail: 'Une fiche client a été mise à jour.',
    route: '/clients',
    scope: 'commercial',
  },
  [AuditEvent.CLIENT_DELETED]: {
    title: 'Client archivé',
    fallbackDetail: 'Une fiche client a été archivée.',
    route: '/clients',
    scope: 'commercial',
  },
  [AuditEvent.PRODUCT_CREATED]: {
    title: 'Nouveau produit',
    fallbackDetail: 'Un produit a été ajouté au catalogue.',
    route: '/produits',
    scope: 'commercial',
  },
  [AuditEvent.PRODUCT_UPDATED]: {
    title: 'Produit modifié',
    fallbackDetail: 'Un produit du catalogue a été mis à jour.',
    route: '/produits',
    scope: 'commercial',
  },
  [AuditEvent.PRODUCT_DELETED]: {
    title: 'Produit archivé',
    fallbackDetail: 'Un produit du catalogue a été archivé.',
    route: '/produits',
    scope: 'commercial',
  },
  [AuditEvent.SUPPLIER_CREATED]: {
    title: 'Nouveau fournisseur',
    fallbackDetail: 'Un fournisseur a été ajouté.',
    route: '/fournisseurs',
    scope: 'procurement',
  },
  [AuditEvent.SUPPLIER_UPDATED]: {
    title: 'Fournisseur modifié',
    fallbackDetail: 'Une fiche fournisseur a été mise à jour.',
    route: '/fournisseurs',
    scope: 'procurement',
  },
  [AuditEvent.SUPPLIER_DELETED]: {
    title: 'Fournisseur archivé',
    fallbackDetail: 'Une fiche fournisseur a été archivée.',
    route: '/fournisseurs',
    scope: 'procurement',
  },
  [AuditEvent.STOCK_ITEM_CREATED]: {
    title: 'Nouvel article de stock',
    fallbackDetail: 'Un article a été ajouté au stock.',
    route: '/stock',
    scope: 'stock',
  },
  [AuditEvent.STOCK_ITEM_UPDATED]: {
    title: 'Article de stock modifié',
    fallbackDetail: 'La fiche d’un article a été mise à jour.',
    route: '/stock',
    scope: 'stock',
  },
  [AuditEvent.STOCK_ITEM_DELETED]: {
    title: 'Article archivé',
    fallbackDetail: 'Un article de stock a été archivé.',
    route: '/stock',
    scope: 'stock',
  },
  [AuditEvent.STOCK_MOVEMENT_CREATED]: {
    title: 'Mouvement de stock',
    fallbackDetail: 'Une entrée, sortie ou régularisation a été enregistrée.',
    route: '/mouvements',
    scope: 'warehouse',
  },
  [AuditEvent.ORDER_CREATED]: {
    title: 'Nouvelle commande client',
    fallbackDetail: 'Une commande client a été créée.',
    route: '/commandes',
    scope: 'organization',
  },
  [AuditEvent.ORDER_STATUS_UPDATED]: {
    title: 'Commande mise à jour',
    fallbackDetail: 'Le statut d’une commande a changé.',
    route: '/commandes',
    scope: 'organization',
  },
  [AuditEvent.INVOICE_ISSUED]: {
    title: 'Facture émise',
    fallbackDetail: 'Une facture client a été émise.',
    route: '/factures',
    scope: 'invoicing',
  },
  [AuditEvent.PURCHASE_ORDER_CREATED]: {
    title: 'Commande fournisseur créée',
    fallbackDetail: 'Un approvisionnement a été commandé.',
    route: '/achats',
    scope: 'stock',
  },
  [AuditEvent.PURCHASE_RECEIPT_CREATED]: {
    title: 'Réception fournisseur enregistrée',
    fallbackDetail: 'Une livraison a été enregistrée dans le stock.',
    route: '/receptions',
    scope: 'stock',
  },
  [AuditEvent.QUOTE_CREATED]: {
    title: 'Nouveau devis',
    fallbackDetail: 'Un devis a été créé.',
    route: '/devis',
    scope: 'commercial',
  },
  [AuditEvent.QUOTE_STATUS_UPDATED]: {
    title: 'Devis mis à jour',
    fallbackDetail: 'Le statut d’un devis a changé.',
    route: '/devis',
    scope: 'commercial',
  },
  [AuditEvent.QUOTE_CONVERTED_TO_ORDER]: {
    title: 'Devis converti',
    fallbackDetail: 'Un devis a été converti en commande.',
    route: '/commandes',
    scope: 'commercial',
  },
  [AuditEvent.PRODUCTION_TASK_CREATED]: {
    title: 'Tâche de production planifiée',
    fallbackDetail: 'Une commande a été ajoutée au planning de production.',
    route: '/planning',
    scope: 'production',
  },
  [AuditEvent.PRODUCTION_SCHEDULE_UPDATED]: {
    title: 'Créneau de production modifié',
    fallbackDetail: 'Le créneau d’une tâche de production a été modifié.',
    route: '/planning',
    scope: 'production',
  },
  [AuditEvent.PRODUCTION_TASK_ASSIGNED]: {
    title: 'Tâche de production affectée',
    fallbackDetail: 'Un opérateur a été affecté à une tâche.',
    route: '/production',
    scope: 'production',
  },
  [AuditEvent.PRODUCTION_STAGE_UPDATED]: {
    title: 'Étape de production mise à jour',
    fallbackDetail: 'Une tâche a avancé dans le processus de production.',
    route: '/production',
    scope: 'production',
  },
  [AuditEvent.MACHINE_CREATED]: {
    title: 'Nouvelle machine',
    fallbackDetail: 'Une machine a été ajoutée au parc.',
    route: '/machines',
    scope: 'production',
  },
  [AuditEvent.MACHINE_UPDATED]: {
    title: 'Machine mise à jour',
    fallbackDetail: 'L’état d’une machine a changé.',
    route: '/machines',
    scope: 'production',
  },
  [AuditEvent.MAINTENANCE_SCHEDULED]: {
    title: 'Maintenance planifiée',
    fallbackDetail: 'Une intervention de maintenance a été planifiée.',
    route: '/maintenance',
    scope: 'production',
  },
  [AuditEvent.MAINTENANCE_UPDATED]: {
    title: 'Maintenance mise à jour',
    fallbackDetail: 'Le statut d’une intervention a changé.',
    route: '/maintenance',
    scope: 'production',
  },
  [AuditEvent.EMPLOYEE_CREATED]: {
    title: 'Nouvel employé',
    fallbackDetail: 'Un dossier employé a été créé.',
    route: '/employes',
    scope: 'hr',
  },
  [AuditEvent.EMPLOYEE_UPDATED]: {
    title: 'Dossier employé modifié',
    fallbackDetail: 'Un dossier employé a été mis à jour.',
    route: '/employes',
    scope: 'hr',
  },
  [AuditEvent.EMPLOYEE_ARCHIVED]: {
    title: 'Employé archivé',
    fallbackDetail: 'Un dossier employé a été archivé.',
    route: '/employes',
    scope: 'hr',
  },
  [AuditEvent.ATTENDANCE_RECORDED]: {
    title: 'Présence enregistrée',
    fallbackDetail: 'Un pointage a été enregistré ou corrigé.',
    route: '/presences',
    scope: 'hr',
  },
  [AuditEvent.HR_TASK_CREATED]: {
    title: 'Nouvelle tâche RH',
    fallbackDetail: 'Une tâche RH a été créée.',
    route: '/taches',
    scope: 'hr',
  },
  [AuditEvent.HR_TASK_UPDATED]: {
    title: 'Tâche RH mise à jour',
    fallbackDetail: 'Une tâche RH a été modifiée.',
    route: '/taches',
    scope: 'hr',
  },
  [AuditEvent.HR_TASK_ARCHIVED]: {
    title: 'Tâche RH archivée',
    fallbackDetail: 'Une tâche RH a été archivée.',
    route: '/taches',
    scope: 'hr',
  },
  [AuditEvent.PAYROLL_COMPENSATION_UPDATED]: {
    title: 'Rémunération mise à jour',
    fallbackDetail: 'Une base de rémunération a été modifiée.',
    route: '/remuneration',
    scope: 'hr',
  },
  [AuditEvent.FINANCE_TRANSACTION_CREATED]: {
    title: 'Mouvement financier',
    fallbackDetail: 'Une entrée ou une dépense a été enregistrée.',
    route: '/finance',
    scope: 'finance',
  },
  [AuditEvent.FINANCE_ORDER_PAYMENT_RECEIVED]: {
    title: 'Paiement client reçu',
    fallbackDetail: 'Un règlement a été enregistré pour une commande.',
    route: '/finance',
    scope: 'finance',
  },
  [AuditEvent.FINANCE_TRANSFER_CREATED]: {
    title: 'Transfert financier',
    fallbackDetail: 'Un transfert entre comptes a été enregistré.',
    route: '/finance',
    scope: 'finance',
  },
  [AuditEvent.BANK_RECONCILIATION_CREATED]: {
    title: 'Rapprochement bancaire ouvert',
    fallbackDetail: 'Une nouvelle période de rapprochement a été ouverte.',
    route: '/banque',
    scope: 'finance',
  },
  [AuditEvent.BANK_RECONCILIATION_COMPLETED]: {
    title: 'Rapprochement bancaire terminé',
    fallbackDetail: 'Un rapprochement bancaire a été clôturé.',
    route: '/banque',
    scope: 'finance',
  },
  [AuditEvent.BANK_RECONCILIATION_CANCELLED]: {
    title: 'Rapprochement bancaire annulé',
    fallbackDetail: 'Un rapprochement bancaire a été annulé.',
    route: '/banque',
    scope: 'finance',
  },
};

const inboxSize = 30;
const closedOrderStatuses = [OrderStatus.DELIVERED, OrderStatus.COMPLETED, OrderStatus.CANCELLED];
const defaultPreferences: NotificationPreferencesDto = {
  lowStockEnabled: true,
  orderDueEnabled: true,
  maintenanceEnabled: true,
};

function dateInTimeZone(timeZone: string, offsetDays = 0): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const datePart = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '';
  const localDate = `${datePart('year')}-${datePart('month')}-${datePart('day')}`;
  const date = new Date(`${localDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
    @InjectRepository(NotificationRead)
    private readonly readsRepository: Repository<NotificationRead>,
    @InjectRepository(StockItem)
    private readonly stockRepository: Repository<StockItem>,
    @InjectRepository(SalesOrder)
    private readonly ordersRepository: Repository<SalesOrder>,
    @InjectRepository(MachineMaintenance)
    private readonly maintenanceRepository: Repository<MachineMaintenance>,
    @InjectRepository(NotificationPreferences)
    private readonly preferencesRepository: Repository<NotificationPreferences>,
    @InjectRepository(Organization)
    private readonly organizationsRepository: Repository<Organization>,
  ) {}

  async getPreferences(actor: AuthenticatedUser): Promise<NotificationPreferencesDto> {
    const preferences = await this.preferencesRepository.findOneBy({ userId: actor.id });
    if (!preferences) return defaultPreferences;
    return {
      lowStockEnabled: preferences.lowStockEnabled,
      orderDueEnabled: preferences.orderDueEnabled,
      maintenanceEnabled: preferences.maintenanceEnabled,
    };
  }

  async updatePreferences(
    actor: AuthenticatedUser,
    dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesDto> {
    await this.preferencesRepository.save(this.preferencesRepository.create({ userId: actor.id, ...dto }));
    return {
      lowStockEnabled: dto.lowStockEnabled,
      orderDueEnabled: dto.orderDueEnabled,
      maintenanceEnabled: dto.maintenanceEnabled,
    };
  }

  async list(actor: AuthenticatedUser): Promise<NotificationListDto> {
    const [preferences, organization] = await Promise.all([
      this.getPreferences(actor),
      this.organizationsRepository.findOneBy({ id: actor.organizationId }),
    ]);
    const timeZone = organization?.timezone || 'Indian/Antananarivo';
    const events = this.visibleEvents(actor);
    const canViewStockAlerts = actor.roles.some((role) =>
      [UserRole.ADMIN, UserRole.STOCK_MANAGER, UserRole.PRODUCTION_MANAGER, UserRole.OPERATOR].includes(role),
    );
    const canViewMaintenanceAlerts = actor.roles.some((role) =>
      [UserRole.ADMIN, UserRole.PRODUCTION_MANAGER].includes(role),
    );
    const today = dateInTimeZone(timeZone);
    const [logs, lowStock, dueOrders, upcomingMaintenance] = await Promise.all([
      events.length
        ? this.auditRepository.find({
            where: { organizationId: actor.organizationId, event: In(events) },
            order: { createdAt: 'DESC' },
            take: inboxSize,
          })
        : Promise.resolve([] as AuditLog[]),
      canViewStockAlerts && preferences.lowStockEnabled
        ? this.stockRepository
            .createQueryBuilder('item')
            .where('item.organizationId = :organizationId', { organizationId: actor.organizationId })
            .andWhere('(item.quantity = 0 OR item.quantity <= item.minimumQuantity)')
            .orderBy('item.quantity', 'ASC')
            .take(inboxSize)
            .getMany()
        : Promise.resolve([] as StockItem[]),
      preferences.orderDueEnabled
        ? this.ordersRepository.find({
            where: {
              organizationId: actor.organizationId,
              dueDate: LessThanOrEqual(dateInTimeZone(timeZone, 1)),
              status: Not(In(closedOrderStatuses)),
            },
            order: { dueDate: 'ASC' },
            take: inboxSize,
          })
        : Promise.resolve([] as SalesOrder[]),
      canViewMaintenanceAlerts && preferences.maintenanceEnabled
        ? this.maintenanceRepository.find({
            where: {
              organizationId: actor.organizationId,
              status: MaintenanceStatus.PLANNED,
              scheduledFor: LessThanOrEqual(dateInTimeZone(timeZone, 5)),
            },
            relations: { machine: true },
            order: { scheduledFor: 'ASC' },
            take: inboxSize,
          })
        : Promise.resolve([] as MachineMaintenance[]),
    ]);

    const candidates: NotificationSummaryDto[] = [
      ...logs.map((log) => this.toSummary(log, false)),
      ...lowStock.map((item) => this.toStockAlert(item)),
      ...dueOrders.map((order) => this.toDueOrderAlert(order, today)),
      ...upcomingMaintenance.map((maintenance) => this.toMaintenanceAlert(maintenance, timeZone)),
    ]
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, inboxSize);
    if (candidates.length === 0) return { items: [], unreadCount: 0 };

    const reads = await this.readsRepository.find({
      where: {
        userId: actor.id,
        notificationId: In(candidates.map((item) => item.id)),
      },
    });
    const readIds = new Set(reads.map((read) => read.notificationId));
    const items = candidates.map((item) => ({ ...item, isRead: readIds.has(item.id) }));
    return {
      items,
      unreadCount: items.filter((item) => !item.isRead).length,
    };
  }

  async markRead(
    actor: AuthenticatedUser,
    dto: MarkNotificationsReadDto,
  ): Promise<NotificationReadResultDto> {
    const visible = await this.list(actor);
    const requested = new Set(dto.notificationIds);
    const notificationIds = visible.items.filter((item) => requested.has(item.id)).map((item) => item.id);
    if (notificationIds.length === 0) throw new NotFoundException('Notification introuvable.');

    await this.readsRepository
      .createQueryBuilder()
      .insert()
      .values(notificationIds.map((notificationId) => ({ userId: actor.id, notificationId })))
      .orIgnore()
      .execute();

    return { markedRead: notificationIds.length };
  }

  private visibleEvents(actor: AuthenticatedUser): AuditEvent[] {
    return (Object.keys(notificationDefinitions) as AuditEvent[]).filter((event) => {
      const scope = notificationDefinitions[event]?.scope;
      if (!scope || scope === 'organization') return true;
      if (scope === 'admin') return actor.roles.includes(UserRole.ADMIN);
      if (scope === 'commercial') {
        return actor.roles.some((role) => [UserRole.ADMIN, UserRole.COMMERCIAL].includes(role));
      }
      if (scope === 'invoicing') {
        return actor.roles.some((role) =>
          [UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.COMMERCIAL].includes(role),
        );
      }
      if (scope === 'procurement') {
        return actor.roles.some((role) =>
          [UserRole.ADMIN, UserRole.COMMERCIAL, UserRole.STOCK_MANAGER].includes(role),
        );
      }
      if (scope === 'stock') {
        return actor.roles.some((role) => [UserRole.ADMIN, UserRole.STOCK_MANAGER].includes(role));
      }
      if (scope === 'warehouse') {
        return actor.roles.some((role) =>
          [UserRole.ADMIN, UserRole.STOCK_MANAGER, UserRole.PRODUCTION_MANAGER, UserRole.OPERATOR].includes(
            role,
          ),
        );
      }
      if (scope === 'production') {
        return actor.roles.some((role) =>
          [UserRole.ADMIN, UserRole.PRODUCTION_MANAGER, UserRole.OPERATOR].includes(role),
        );
      }
      if (scope === 'finance') {
        return actor.roles.some((role) => [UserRole.ADMIN, UserRole.ACCOUNTANT].includes(role));
      }
      return actor.roles.some((role) => [UserRole.ADMIN, UserRole.HR_MANAGER].includes(role));
    });
  }

  private toSummary(log: AuditLog, isRead: boolean): NotificationSummaryDto {
    const definition = notificationDefinitions[log.event];
    return {
      id: `event:${log.id}`,
      title: definition?.title ?? 'Activité',
      detail: this.getDetail(log, definition?.fallbackDetail ?? 'Une activité a été enregistrée.'),
      route: definition?.route ?? '/dashboard',
      createdAt: log.createdAt,
      isRead,
    };
  }

  private toStockAlert(item: StockItem): NotificationSummaryDto {
    const isOut = item.quantity === 0;
    return {
      id: `alert:stock:${item.id}:${item.updatedAt.getTime()}`,
      title: isOut ? 'Article en rupture de stock' : 'Stock sous le seuil minimum',
      detail: `${item.name} : ${item.quantity} ${item.unit} restant(s), seuil ${item.minimumQuantity}.`,
      route: '/stock',
      createdAt: item.updatedAt,
      isRead: false,
    };
  }

  private toDueOrderAlert(order: SalesOrder, today: string): NotificationSummaryDto {
    const isOverdue = Boolean(order.dueDate && order.dueDate < today);
    return {
      id: `alert:order:${order.id}:${order.dueDate ?? ''}`,
      title: isOverdue ? 'Commande en retard' : 'Échéance de commande proche',
      detail: `${order.orderNumber} · échéance ${order.dueDate ?? 'à confirmer'}.`,
      route: '/commandes',
      createdAt: order.updatedAt,
      isRead: false,
    };
  }

  private toMaintenanceAlert(maintenance: MachineMaintenance, timeZone: string): NotificationSummaryDto {
    return {
      id: `alert:maintenance:${maintenance.id}:${maintenance.scheduledFor}`,
      title:
        maintenance.scheduledFor < dateInTimeZone(timeZone) ? 'Maintenance en retard' : 'Maintenance à venir',
      detail: `${maintenance.machine?.name ?? 'Machine'} · ${maintenance.scheduledFor}.`,
      route: '/maintenance',
      createdAt: maintenance.createdAt,
      isRead: false,
    };
  }

  private getDetail(log: AuditLog, fallback: string): string {
    const metadata = log.metadata ?? {};
    const text = (key: string): string | null => {
      const value = metadata[key];
      return typeof value === 'string' && value.trim() ? value.trim() : null;
    };

    if (log.event === AuditEvent.ORDER_CREATED) {
      const number = text('orderNumber');
      return number ? `Commande ${number} créée.` : fallback;
    }
    if (log.event === AuditEvent.INVOICE_ISSUED) {
      const invoiceNumber = text('invoiceNumber');
      const orderNumber = text('orderNumber');
      return invoiceNumber && orderNumber
        ? `${invoiceNumber} · commande ${orderNumber}.`
        : (invoiceNumber ?? fallback);
    }
    if (log.event === AuditEvent.PRODUCTION_SCHEDULE_UPDATED) {
      const date = text('scheduledDate');
      const start = text('startTime')?.slice(0, 5);
      const end = text('endTime')?.slice(0, 5);
      return date && start && end
        ? `Créneau réservé le ${date}, de ${start} à ${end}.`
        : 'Créneau retiré du planning.';
    }
    if (log.event === AuditEvent.PURCHASE_ORDER_CREATED) {
      const number = text('purchaseNumber');
      const lineCount = metadata.lineCount;
      const suffix = typeof lineCount === 'number' ? ` · ${lineCount} article(s)` : '';
      return number ? `${number}${suffix}` : fallback;
    }
    if (log.event === AuditEvent.ORDER_STATUS_UPDATED) {
      const status = text('to');
      return status ? `Nouveau statut : ${status}.` : fallback;
    }
    if (log.event === AuditEvent.STOCK_MOVEMENT_CREATED) {
      const kind = text('kind');
      const labels: Record<string, string> = {
        ENTRY: 'Entrée de stock enregistrée.',
        EXIT: 'Sortie de stock enregistrée.',
        ADJUSTMENT: 'Régularisation de stock enregistrée.',
      };
      return kind ? (labels[kind] ?? fallback) : fallback;
    }
    if (log.event === AuditEvent.FINANCE_TRANSACTION_CREATED) {
      const type = text('type');
      const amount = metadata.amount;
      return type && typeof amount === 'number'
        ? `${type === 'INCOME' ? 'Entrée' : 'Dépense'} de ${new Intl.NumberFormat('fr-FR').format(amount)} Ar.`
        : fallback;
    }
    return fallback;
  }
}
