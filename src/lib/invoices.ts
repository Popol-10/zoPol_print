import { apiRequest, withBearer } from "@/lib/api";

export type InvoicePaymentStatus = "ISSUED" | "PARTIALLY_PAID" | "PAID";

export interface InvoiceLineRecord {
  id: string;
  productName: string;
  productReference: string;
  machine: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  clientName: string;
  clientCompany: string | null;
  issuedAt: string;
  total: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: InvoicePaymentStatus;
  lines: InvoiceLineRecord[];
  createdAt: string;
}

export interface InvoiceEligibleOrder {
  id: string;
  orderNumber: string;
  clientName: string;
  clientCompany: string | null;
  productName: string;
  productReference: string;
  quantity: number;
  unitPrice: number;
  total: number;
  paidAmount: number;
  status: string;
  orderedAt: string;
}

export const invoicesApi = {
  list: (accessToken: string) =>
    apiRequest<InvoiceRecord[]>("/invoices", {
      headers: withBearer(accessToken),
    }),
  eligibleOrders: (accessToken: string) =>
    apiRequest<InvoiceEligibleOrder[]>("/invoices/eligible-orders", {
      headers: withBearer(accessToken),
    }),
  issueFromOrder: (accessToken: string, orderId: string) =>
    apiRequest<InvoiceRecord>(`/invoices/from-order/${orderId}`, {
      method: "POST",
      headers: withBearer(accessToken),
    }),
};
