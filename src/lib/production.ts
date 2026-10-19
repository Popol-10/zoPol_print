import { apiRequest, withBearer } from "@/lib/api";
import type { OrderRecord } from "@/lib/orders";

export type ProductionStage =
  "À produire" | "En production" | "Contrôle qualité" | "Terminé";

export interface ProductionScheduleInput {
  scheduledDate: string | null;
  scheduledStartTime: string | null;
  scheduledEndTime: string | null;
}

export interface ProductionTaskRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  customer: string;
  product: string;
  quantity: number;
  machine: string;
  employeeId: string | null;
  operatorName: string;
  priority: "Normale" | "Haute" | "Urgente";
  dueDate: string | null;
  scheduledDate: string | null;
  scheduledStartTime: string | null;
  scheduledEndTime: string | null;
  stage: ProductionStage;
  createdAt: string;
  updatedAt: string;
}

export const productionApi = {
  tasks: (accessToken: string) =>
    apiRequest<ProductionTaskRecord[]>("/production/tasks", {
      headers: withBearer(accessToken),
    }),
  availableOrders: (accessToken: string) =>
    apiRequest<OrderRecord[]>("/production/orders", {
      headers: withBearer(accessToken),
    }),
  planOrder: (
    accessToken: string,
    orderId: string,
    schedule?: ProductionScheduleInput,
  ) =>
    apiRequest<ProductionTaskRecord>("/production/tasks", {
      method: "POST",
      body: JSON.stringify(schedule ? { orderId, ...schedule } : { orderId }),
      headers: withBearer(accessToken),
    }),
  updateSchedule: (
    accessToken: string,
    taskId: string,
    schedule: ProductionScheduleInput,
  ) =>
    apiRequest<ProductionTaskRecord>(`/production/tasks/${taskId}/schedule`, {
      method: "PATCH",
      body: JSON.stringify(schedule),
      headers: withBearer(accessToken),
    }),
  assign: (accessToken: string, taskId: string, employeeId: string | null) =>
    apiRequest<ProductionTaskRecord>(`/production/tasks/${taskId}/assignee`, {
      method: "PATCH",
      body: JSON.stringify({ employeeId }),
      headers: withBearer(accessToken),
    }),
  updateStage: (accessToken: string, taskId: string, stage: ProductionStage) =>
    apiRequest<ProductionTaskRecord>(`/production/tasks/${taskId}/stage`, {
      method: "PATCH",
      body: JSON.stringify({ stage }),
      headers: withBearer(accessToken),
    }),
};
