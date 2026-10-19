import { apiRequest, withBearer } from "@/lib/api";

export type HrTaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";

export interface HrTaskRecord {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  employeeId: string | null;
  employeeName: string | null;
  status: HrTaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface HrTaskInput {
  title: string;
  description: string | null;
  dueDate: string;
  employeeId: string | null;
}

export const hrTasksApi = {
  list: (accessToken: string) =>
    apiRequest<HrTaskRecord[]>("/hr/tasks", {
      headers: withBearer(accessToken),
    }),
  create: (accessToken: string, input: HrTaskInput) =>
    apiRequest<HrTaskRecord>("/hr/tasks", {
      method: "POST",
      body: JSON.stringify(input),
      headers: withBearer(accessToken),
    }),
  update: (
    accessToken: string,
    taskId: string,
    input: Partial<HrTaskInput> & { status?: HrTaskStatus },
  ) =>
    apiRequest<HrTaskRecord>("/hr/tasks/" + taskId, {
      method: "PATCH",
      body: JSON.stringify(input),
      headers: withBearer(accessToken),
    }),
  archive: (accessToken: string, taskId: string) =>
    apiRequest<void>("/hr/tasks/" + taskId, {
      method: "DELETE",
      headers: withBearer(accessToken),
    }),
};
