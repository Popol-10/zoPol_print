import { apiRequest, withBearer } from "@/lib/api";

export type OrderStatus =
  | "Nouveau"
  | "Confirmé"
  | "À produire"
  | "En production"
  | "Contrôle qualité"
  | "Prêt"
  | "Livré"
  | "Terminé"
  | "En attente"
  | "Bloqué"
  | "Annulé";
export type OrderPriority = "Normale" | "Haute" | "Urgente";

export interface OrderRecord {
  id: string;
  orderNumber: string;
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
  paidAmount: number;
  status: OrderStatus;
  priority: OrderPriority;
  orderedAt: string;
  dueDate: string | null;
  operatorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  clientId: string;
  productId: string;
  quantity: number;
  priority: OrderPriority;
  dueDate: string | null;
}

export const ordersApi = {
  list: (accessToken: string) =>
    apiRequest<OrderRecord[]>("/orders", {
      headers: withBearer(accessToken),
    }),
  create: (accessToken: string, input: CreateOrderInput) =>
    apiRequest<OrderRecord>("/orders", {
      method: "POST",
      body: JSON.stringify(input),
      headers: withBearer(accessToken),
    }),
  updateStatus: (accessToken: string, orderId: string, status: OrderStatus) =>
    apiRequest<OrderRecord>(`/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
      headers: withBearer(accessToken),
    }),
};
