import { apiRequest, withBearer } from "@/lib/api";

export type QuoteStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REFUSED" | "EXPIRED";

export interface QuoteRecord {
  id: string;
  quoteNumber: string;
  clientId: string;
  clientName: string;
  clientCompany: string | null;
  productId: string;
  productName: string;
  productReference: string;
  machine: string;
  quantity: number;
  unitPrice: number;
  total: number;
  status: QuoteStatus;
  validUntil: string;
  note: string | null;
  orderId: string | null;
  orderNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuoteInput {
  clientId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  validUntil: string;
  note: string | null;
}

export const quotesApi = {
  list: (accessToken: string) =>
    apiRequest<QuoteRecord[]>("/quotes", {
      headers: withBearer(accessToken),
    }),
  create: (accessToken: string, input: CreateQuoteInput) =>
    apiRequest<QuoteRecord>("/quotes", {
      method: "POST",
      body: JSON.stringify(input),
      headers: withBearer(accessToken),
    }),
  updateStatus: (accessToken: string, quoteId: string, status: QuoteStatus) =>
    apiRequest<QuoteRecord>(`/quotes/${quoteId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
      headers: withBearer(accessToken),
    }),
  convert: (accessToken: string, quoteId: string) =>
    apiRequest<QuoteRecord>(`/quotes/${quoteId}/convert`, {
      method: "POST",
      headers: withBearer(accessToken),
    }),
};
