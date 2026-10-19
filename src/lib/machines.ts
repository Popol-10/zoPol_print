import { apiRequest, withBearer } from "@/lib/api";

export type MachineStatus = "ACTIVE" | "MAINTENANCE" | "OFFLINE" | "ATTENTION";
export type MaintenanceKind = "PREVENTIVE" | "CORRECTIVE";
export type MaintenanceStatus =
  "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface MachineRecord {
  id: string;
  name: string;
  type: string;
  status: MachineStatus;
  nextMaintenanceAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceRecord {
  id: string;
  machineId: string;
  machineName: string;
  scheduledFor: string;
  kind: MaintenanceKind;
  status: MaintenanceStatus;
  description: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMachineInput {
  name: string;
  type: string;
}

export interface CreateMaintenanceInput {
  machineId: string;
  scheduledFor: string;
  kind: MaintenanceKind;
  description: string;
}

export const machinesApi = {
  list: (accessToken: string) =>
    apiRequest<MachineRecord[]>("/machines", {
      headers: withBearer(accessToken),
    }),
  create: (accessToken: string, input: CreateMachineInput) =>
    apiRequest<MachineRecord>("/machines", {
      method: "POST",
      body: JSON.stringify(input),
      headers: withBearer(accessToken),
    }),
  updateStatus: (
    accessToken: string,
    machineId: string,
    status: MachineStatus,
  ) =>
    apiRequest<MachineRecord>(`/machines/${machineId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
      headers: withBearer(accessToken),
    }),
  maintenance: (accessToken: string) =>
    apiRequest<MaintenanceRecord[]>("/machines/maintenance", {
      headers: withBearer(accessToken),
    }),
  scheduleMaintenance: (accessToken: string, input: CreateMaintenanceInput) =>
    apiRequest<MaintenanceRecord>("/machines/maintenance", {
      method: "POST",
      body: JSON.stringify(input),
      headers: withBearer(accessToken),
    }),
  updateMaintenanceStatus: (
    accessToken: string,
    maintenanceId: string,
    status: MaintenanceStatus,
  ) =>
    apiRequest<MaintenanceRecord>(
      `/machines/maintenance/${maintenanceId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
        headers: withBearer(accessToken),
      },
    ),
};
