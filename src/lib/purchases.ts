import { apiRequest, withBearer } from "@/lib/api";

export type PurchaseOrderStatus = "ORDERED" | "PARTIALLY_RECEIVED" | "RECEIVED";

export interface PurchaseOrderLineRecord {
  id: string;
  stockItemId: string;
  itemName: string;
  itemReference: string;
  unit: string;
  quantityOrdered: number;
  quantityReceived: number;
  quantityRemaining: number;
  unitCost: number;
  total: number;
}

export interface PurchaseOrderRecord {
  id: string;
  purchaseNumber: string;
  supplierId: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  expectedDate: string | null;
  notes: string | null;
  total: number;
  lineCount: number;
  lines: PurchaseOrderLineRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseOrderInput {
  supplierId: string;
  expectedDate?: string;
  notes?: string | null;
  lines: Array<{
    stockItemId: string;
    quantity: number;
    unitCost: number;
  }>;
}

export interface PurchaseReceiptLineRecord {
  id: string;
  purchaseOrderLineId: string;
  stockItemId: string;
  itemName: string;
  itemReference: string;
  unit: string;
  quantity: number;
}

export interface PurchaseReceiptRecord {
  id: string;
  receiptNumber: string;
  purchaseOrderId: string;
  purchaseNumber: string;
  supplierName: string;
  deliveryReference: string | null;
  notes: string | null;
  actorName: string;
  receivedAt: string;
  lines: PurchaseReceiptLineRecord[];
}

export interface CreatePurchaseReceiptInput {
  deliveryReference?: string | null;
  notes?: string | null;
  lines: Array<{
    purchaseOrderLineId: string;
    quantity: number;
  }>;
}

export const purchasesApi = {
  list: (accessToken: string) =>
    apiRequest<PurchaseOrderRecord[]>("/purchases", {
      headers: withBearer(accessToken),
    }),
  create: (accessToken: string, input: CreatePurchaseOrderInput) =>
    apiRequest<PurchaseOrderRecord>("/purchases", {
      method: "POST",
      body: JSON.stringify(input),
      headers: withBearer(accessToken),
    }),
  listReceipts: (accessToken: string) =>
    apiRequest<PurchaseReceiptRecord[]>("/purchases/receipts", {
      headers: withBearer(accessToken),
    }),
  receive: (
    accessToken: string,
    purchaseOrderId: string,
    input: CreatePurchaseReceiptInput,
  ) =>
    apiRequest<PurchaseReceiptRecord>(
      `/purchases/${encodeURIComponent(purchaseOrderId)}/receipts`,
      {
        method: "POST",
        body: JSON.stringify(input),
        headers: withBearer(accessToken),
      },
    ),
};
