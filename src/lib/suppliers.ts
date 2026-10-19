import { apiRequest, withBearer } from "@/lib/api";

export interface SupplierRecord {
  id: string;
  name: string;
  category: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SupplierInput = Omit<SupplierRecord, "id" | "createdAt" | "updatedAt">;

export const suppliersApi = {
  list: (accessToken: string) =>
    apiRequest<SupplierRecord[]>("/suppliers", {
      headers: withBearer(accessToken),
    }),
  create: (accessToken: string, input: SupplierInput) =>
    apiRequest<SupplierRecord>("/suppliers", {
      method: "POST",
      body: JSON.stringify(input),
      headers: withBearer(accessToken),
    }),
  update: (accessToken: string, supplierId: string, input: Partial<SupplierInput>) =>
    apiRequest<SupplierRecord>(`/suppliers/${supplierId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
      headers: withBearer(accessToken),
    }),
  archive: (accessToken: string, supplierId: string) =>
    apiRequest<void>(`/suppliers/${supplierId}`, {
      method: "DELETE",
      headers: withBearer(accessToken),
    }),
};
