import 'dotenv/config';
import { DataSource } from 'typeorm';
import { PasswordResetToken } from '../modules/auth/entities/password-reset-token.entity';
import { validateEnvironment } from '../config/environment.validation';
import { AuditLog } from '../modules/audit/entities/audit-log.entity';
import { Organization } from '../modules/organizations/entities/organization.entity';
import { User } from '../modules/users/entities/user.entity';
import { Client } from '../modules/clients/entities/client.entity';
import { Product } from '../modules/products/entities/product.entity';
import { Supplier } from '../modules/suppliers/entities/supplier.entity';
import { StockItem } from '../modules/stock/entities/stock-item.entity';
import { StockMovement } from '../modules/stock/entities/stock-movement.entity';
import { SalesOrder } from '../modules/orders/entities/sales-order.entity';
import { ProductionTask } from '../modules/production/entities/production-task.entity';
import { Machine } from '../modules/machines/entities/machine.entity';
import { MachineMaintenance } from '../modules/machines/entities/machine-maintenance.entity';
import { Employee } from '../modules/employees/entities/employee.entity';
import { AttendanceRecord } from '../modules/attendance/entities/attendance-record.entity';
import { EmployeeTask } from '../modules/hr-tasks/entities/employee-task.entity';
import { EmployeeCompensation } from '../modules/payroll/entities/employee-compensation.entity';
import { FinanceTransaction } from '../modules/finance/entities/finance-transaction.entity';
import { BankReconciliation } from '../modules/finance/entities/bank-reconciliation.entity';
import { Quote } from '../modules/quotes/entities/quote.entity';
import { PurchaseOrder } from '../modules/purchases/entities/purchase-order.entity';
import { PurchaseOrderLine } from '../modules/purchases/entities/purchase-order-line.entity';
import { PurchaseReceipt } from '../modules/purchases/entities/purchase-receipt.entity';
import { PurchaseReceiptLine } from '../modules/purchases/entities/purchase-receipt-line.entity';
import { NotificationRead } from '../modules/notifications/entities/notification-read.entity';
import { NotificationPreferences } from '../modules/notifications/entities/notification-preferences.entity';
import { UserProfile } from '../modules/users/entities/user-profile.entity';
import { Invoice } from '../modules/invoices/entities/invoice.entity';
import { InvoiceLine } from '../modules/invoices/entities/invoice-line.entity';

const env = validateEnvironment(process.env);

export default new DataSource({
  type: 'mysql',
  host: env.MYSQL_HOST,
  port: env.MYSQL_PORT,
  username: env.MYSQL_USER,
  password: env.MYSQL_PASSWORD,
  database: env.MYSQL_DATABASE,
  timezone: 'Z',
  entities: [
    Organization,
    User,
    AuditLog,
    PasswordResetToken,
    Client,
    Product,
    Supplier,
    StockItem,
    StockMovement,
    SalesOrder,
    ProductionTask,
    Machine,
    MachineMaintenance,
    Employee,
    AttendanceRecord,
    EmployeeTask,
    EmployeeCompensation,
    FinanceTransaction,
    BankReconciliation,
    Quote,
    PurchaseOrder,
    PurchaseOrderLine,
    PurchaseReceipt,
    PurchaseReceiptLine,
    NotificationRead,
    NotificationPreferences,
    UserProfile,
    Invoice,
    InvoiceLine,
  ],
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
  synchronize: false,
});
