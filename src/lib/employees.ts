import { apiRequest, withBearer } from "@/lib/api";

export type EmployeeStatus = "ACTIVE" | "INACTIVE";

export interface EmployeeRecord {
  id: string;
  name: string;
  position: string;
  phone: string | null;
  email: string | null;
  status: EmployeeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeInput {
  name: string;
  position: string;
  phone: string | null;
  email: string | null;
}

export const employeesApi = {
  list: (accessToken: string) =>
    apiRequest<EmployeeRecord[]>("/employees", {
      headers: withBearer(accessToken),
    }),
  create: (accessToken: string, input: EmployeeInput) =>
    apiRequest<EmployeeRecord>("/employees", {
      method: "POST",
      body: JSON.stringify(input),
      headers: withBearer(accessToken),
    }),
  update: (
    accessToken: string,
    employeeId: string,
    input: Partial<EmployeeInput> & { status?: EmployeeStatus },
  ) =>
    apiRequest<EmployeeRecord>(`/employees/${employeeId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
      headers: withBearer(accessToken),
    }),
  archive: (accessToken: string, employeeId: string) =>
    apiRequest<void>(`/employees/${employeeId}`, {
      method: "DELETE",
      headers: withBearer(accessToken),
    }),
};
