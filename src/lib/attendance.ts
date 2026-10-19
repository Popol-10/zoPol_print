import { apiRequest, withBearer } from "@/lib/api";

export type AttendanceStatus =
  "PRESENT" | "LATE" | "ABSENT" | "LEAVE" | "NOT_RECORDED";

export interface AttendanceRow {
  id: string | null;
  employeeId: string;
  employeeName: string;
  position: string;
  employeeStatus: "ACTIVE" | "INACTIVE";
  date: string;
  status: AttendanceStatus;
  checkIn: string | null;
  checkOut: string | null;
  workedMinutes: number | null;
}

export interface AttendanceInput {
  date: string;
  status: Exclude<AttendanceStatus, "NOT_RECORDED">;
  checkIn: string | null;
  checkOut: string | null;
}

export const attendanceApi = {
  daily: (accessToken: string, date: string) =>
    apiRequest<AttendanceRow[]>(
      `/attendance?date=${encodeURIComponent(date)}`,
      {
        headers: withBearer(accessToken),
      },
    ),
  save: (accessToken: string, employeeId: string, input: AttendanceInput) =>
    apiRequest<AttendanceRow>(`/attendance/${employeeId}`, {
      method: "PUT",
      body: JSON.stringify(input),
      headers: withBearer(accessToken),
    }),
};
