import { apiRequest, withBearer } from "@/lib/api";

export type ClientType = "INDIVIDUAL" | "COMPANY" | "RESELLER";

export interface ClientRecord {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  type: ClientType;
  createdAt: string;
  updatedAt: string;
}

export interface ClientInput {
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  type: ClientType;
}

export const clientsApi = {
  list: (accessToken: string) =>
    apiRequest<ClientRecord[]>("/clients", {
      headers: withBearer(accessToken),
    }),
  create: (accessToken: string, input: ClientInput) =>
    apiRequest<ClientRecord>("/clients", {
      method: "POST",
      body: JSON.stringify(input),
      headers: withBearer(accessToken),
    }),
  update: (accessToken: string, clientId: string, input: ClientInput) =>
    apiRequest<ClientRecord>(`/clients/${clientId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
      headers: withBearer(accessToken),
    }),
  archive: (accessToken: string, clientId: string) =>
    apiRequest<void>(`/clients/${clientId}`, {
      method: "DELETE",
      headers: withBearer(accessToken),
    }),
};
