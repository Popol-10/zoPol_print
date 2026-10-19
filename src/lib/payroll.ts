import { apiRequest, withBearer } from "@/lib/api";

export type EmployeeStatus = "ACTIVE" | "INACTIVE";

export interface CompensationRecord {
  employeeId: string;
  employeeName: string;
  position: string;
  employeeStatus: EmployeeStatus;
  monthlyBaseSalary: number | null;
  effectiveFrom: string | null;
}

export interface CompensationInput {
  monthlyBaseSalary: number;
  effectiveFrom: string;
}

export const payrollApi = {
  salaries: (accessToken: string) =>
    apiRequest<CompensationRecord[]>("/payroll/salaries", {
      headers: withBearer(accessToken),
    }),
  setSalary: (
    accessToken: string,
    employeeId: string,
    input: CompensationInput,
  ) =>
    apiRequest<CompensationRecord>("/payroll/salaries/" + employeeId, {
      method: "PUT",
      body: JSON.stringify(input),
      headers: withBearer(accessToken),
    }),
};
