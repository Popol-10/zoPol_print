import { apiRequest, withBearer } from "@/lib/api";

export type StockMovementKind = "ENTRY" | "EXIT" | "ADJUSTMENT";
export type StockAdjustmentDirection = "INCREASE" | "DECREASE";
export type StockStatus = "En stock" | "Stock faible" | "Critique" | "Rupture";

export interface StockItemRecord {
  id: string;
  name: string;
  reference: string;
  category: string;
  quantity: number;
  minimumQuantity: number;
  unit: string;
  unitCost: number;
  value: number;
  status: StockStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StockItemInput {
  name: string;
  reference: string;
  category: string;
  minimumQuantity: number;
  unit: string;
  unitCost: number;
}

export interface StockMovementRecord {
  id: string;
  itemId: string;
  itemName: string;
  itemReference: string;
  kind: StockMovementKind;
  delta: number;
  beforeQuantity: number;
  afterQuantity: number;
  actorName: string;
  source: string | null;
  notes: string | null;
  createdAt: string;
}

export interface StockMovementInput {
  itemId: string;
  kind: StockMovementKind;
  quantity: number;
  direction?: StockAdjustmentDirection;
  source?: string | null;
  notes?: string | null;
}

export interface StockItemCountInput {
  quantity: number;
  notes?: string | null;
}

export interface StockMovementPage {
  items: StockMovementRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface StockMovementQuery {
  page: number;
  pageSize: number;
  kind?: StockMovementKind;
  itemId?: string;
  search?: string;
}

export const stockApi = {
  list: (accessToken: string) =>
    apiRequest<StockItemRecord[]>("/stock/items", {
      headers: withBearer(accessToken),
    }),
  create: (accessToken: string, input: StockItemInput) =>
    apiRequest<StockItemRecord>("/stock/items", {
      method: "POST",
      body: JSON.stringify(input),
      headers: withBearer(accessToken),
    }),
  update: (
    accessToken: string,
    itemId: string,
    input: Partial<StockItemInput>,
  ) =>
    apiRequest<StockItemRecord>(`/stock/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
      headers: withBearer(accessToken),
    }),
  archive: (accessToken: string, itemId: string) =>
    apiRequest<void>(`/stock/items/${itemId}`, {
      method: "DELETE",
      headers: withBearer(accessToken),
    }),
  count: (accessToken: string, itemId: string, input: StockItemCountInput) =>
    apiRequest<StockMovementRecord>(`/stock/items/${itemId}/count`, {
      method: "POST",
      body: JSON.stringify(input),
      headers: withBearer(accessToken),
    }),
  movements: (accessToken: string, itemId: string) =>
    apiRequest<StockMovementRecord[]>(`/stock/items/${itemId}/movements`, {
      headers: withBearer(accessToken),
    }),
  listMovements: (accessToken: string, query: StockMovementQuery) => {
    const params = new URLSearchParams({
      page: String(query.page),
      pageSize: String(query.pageSize),
    });
    if (query.kind) params.set("kind", query.kind);
    if (query.itemId) params.set("itemId", query.itemId);
    if (query.search) params.set("search", query.search);
    return apiRequest<StockMovementPage>(
      `/stock/movements?${params.toString()}`,
      {
        headers: withBearer(accessToken),
      },
    );
  },
  createMovement: (accessToken: string, input: StockMovementInput) =>
    apiRequest<StockMovementRecord>("/stock/movements", {
      method: "POST",
      body: JSON.stringify(input),
      headers: withBearer(accessToken),
    }),
};
