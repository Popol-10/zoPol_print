import { apiRequest, withBearer } from "@/lib/api";
import type { OrderRecord } from "@/lib/orders";

export type FinanceTransactionType =
  "INCOME" | "EXPENSE" | "OPENING_BALANCE" | "TRANSFER_OUT" | "TRANSFER_IN";
export type FinanceAccountMethod = "CASH" | "BANK" | "MOBILE_MONEY";
export type FinanceTransactionCategory =
  | "SALES"
  | "CLIENT_DEPOSIT"
  | "OTHER_INCOME"
  | "GENERAL_EXPENSE"
  | "INTERNAL_PURCHASE"
  | "LOGISTICS"
  | "MAINTENANCE"
  | "OTHER_EXPENSE"
  | "OPENING_BALANCE"
  | "ACCOUNT_TRANSFER";

export interface FinanceTransactionRecord {
  id: string;
  orderId: string | null;
  orderNumber: string | null;
  transferId: string | null;
  reconciliationId: string | null;
  type: FinanceTransactionType;
  label: string;
  category: FinanceTransactionCategory;
  method: FinanceAccountMethod;
  amount: number;
  transactionDate: string;
  createdAt: string;
}

export interface FinanceTransferInput {
  sourceMethod: FinanceAccountMethod;
  destinationMethod: FinanceAccountMethod;
  amount: number;
  label?: string;
  transactionDate: string;
}

export interface FinanceTransferRecord {
  id: string;
  sourceMethod: FinanceAccountMethod;
  destinationMethod: FinanceAccountMethod;
  amount: number;
  label: string;
  transactionDate: string;
}

export type BankReconciliationStatus = "OPEN" | "RECONCILED" | "CANCELLED";

export interface BankReconciliationSummary {
  id: string;
  periodStart: string;
  periodEnd: string;
  statementOpeningBalance: number;
  statementClosingBalance: number;
  calculatedClosingBalance: number;
  difference: number;
  matchedCount: number;
  transactionCount: number;
  status: BankReconciliationStatus;
  createdAt: string;
  completedAt: string | null;
}

export interface BankReconciliationDetail extends BankReconciliationSummary {
  transactions: FinanceTransactionRecord[];
}

export interface CreateBankReconciliationInput {
  periodStart: string;
  periodEnd: string;
  statementOpeningBalance: number;
  statementClosingBalance: number;
}

export interface FinanceOrderPaymentInput {
  amount: number;
  method: FinanceAccountMethod;
  transactionDate: string;
}

export interface FinanceTransactionInput {
  type: FinanceTransactionType;
  label: string;
  category?: FinanceTransactionCategory;
  method: FinanceAccountMethod;
  amount: number;
  transactionDate: string;
}

export interface FinanceTransactionPage {
  items: FinanceTransactionRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FinanceMonthSummary {
  month: string;
  label: string;
  income: number;
  expense: number;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpenses: number;
  totalBalance: number;
  cashBalance: number;
  bankBalance: number;
  mobileMoneyBalance: number;
  monthly: FinanceMonthSummary[];
}

export interface FinanceTransactionFilters {
  page?: number;
  pageSize?: number;
  type?: FinanceTransactionType;
  method?: FinanceAccountMethod;
  search?: string;
}

export const financeApi = {
  summary: (accessToken: string) =>
    apiRequest<FinanceSummary>("/finance/summary", {
      headers: withBearer(accessToken),
    }),
  transactions: (
    accessToken: string,
    filters: FinanceTransactionFilters = {},
  ) => {
    const params = new URLSearchParams();
    if (filters.page) params.set("page", String(filters.page));
    if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
    if (filters.type) params.set("type", filters.type);
    if (filters.method) params.set("method", filters.method);
    if (filters.search?.trim()) params.set("search", filters.search.trim());
    return apiRequest<FinanceTransactionPage>(
      "/finance/transactions?" + params.toString(),
      { headers: withBearer(accessToken) },
    );
  },
  listReconciliations: (accessToken: string) =>
    apiRequest<BankReconciliationSummary[]>("/finance/reconciliations", {
      headers: withBearer(accessToken),
    }),
  getReconciliation: (accessToken: string, id: string) =>
    apiRequest<BankReconciliationDetail>(`/finance/reconciliations/${id}`, {
      headers: withBearer(accessToken),
    }),
  createReconciliation: (
    accessToken: string,
    input: CreateBankReconciliationInput,
  ) =>
    apiRequest<BankReconciliationDetail>("/finance/reconciliations", {
      method: "POST",
      body: JSON.stringify(input),
      headers: withBearer(accessToken),
    }),
  setReconciliationMatch: (
    accessToken: string,
    reconciliationId: string,
    transactionId: string,
    matched: boolean,
  ) =>
    apiRequest<BankReconciliationDetail>(
      `/finance/reconciliations/${reconciliationId}/transactions/${transactionId}/match`,
      { method: matched ? "POST" : "DELETE", headers: withBearer(accessToken) },
    ),
  completeReconciliation: (accessToken: string, id: string) =>
    apiRequest<BankReconciliationDetail>(
      `/finance/reconciliations/${id}/complete`,
      {
        method: "POST",
        headers: withBearer(accessToken),
      },
    ),
  cancelReconciliation: (accessToken: string, id: string) =>
    apiRequest<BankReconciliationDetail>(`/finance/reconciliations/${id}`, {
      method: "DELETE",
      headers: withBearer(accessToken),
    }),
  createTransfer: (accessToken: string, input: FinanceTransferInput) =>
    apiRequest<FinanceTransferRecord>("/finance/transfers", {
      method: "POST",
      body: JSON.stringify(input),
      headers: withBearer(accessToken),
    }),
  createOrderPayment: (
    accessToken: string,
    orderId: string,
    input: FinanceOrderPaymentInput,
  ) =>
    apiRequest<OrderRecord>(`/finance/orders/${orderId}/payments`, {
      method: "POST",
      body: JSON.stringify(input),
      headers: withBearer(accessToken),
    }),
  createTransaction: (accessToken: string, input: FinanceTransactionInput) =>
    apiRequest<FinanceTransactionRecord>("/finance/transactions", {
      method: "POST",
      body: JSON.stringify(input),
      headers: withBearer(accessToken),
    }),
};
