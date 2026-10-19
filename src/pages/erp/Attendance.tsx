import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CheckCheck, Clock3, Plus, Users } from "lucide-react";
import { Modal, ModalFooter } from "@/components/erp/Modal";
import {
  MetricCard,
  PageHeader,
  PrimaryButton,
  SearchInput,
  SecondaryButton,
} from "@/components/erp/Ui";
import { useAuth } from "@/hooks/useAuth";
import { ApiError, readAuthSession } from "@/lib/auth";
import {
  attendanceApi,
  type AttendanceInput,
  type AttendanceRow,
  type AttendanceStatus,
} from "@/lib/attendance";

function accessToken(): string {
  const session = readAuthSession();
  if (!session)
    throw new ApiError("Votre session a expiré. Reconnectez-vous.", 401);
  return session.tokens.accessToken;
}

function localDateValue(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function statusLabel(status: AttendanceStatus): string {
  return {
    PRESENT: "Présent",
    LATE: "Retard",
    ABSENT: "Absent",
    LEAVE: "Congé",
    NOT_RECORDED: "À saisir",
  }[status];
}

function statusClass(status: AttendanceStatus): string {
  return {
    PRESENT: "bg-emerald-50 text-emerald-700",
    LATE: "bg-amber-50 text-amber-700",
    ABSENT: "bg-rose-50 text-rose-700",
    LEAVE: "bg-violet-50 text-violet-700",
    NOT_RECORDED:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  }[status];
}

function timeLabel(value: string | null): string {
  return value ? value.slice(0, 5) : "—";
}

function durationLabel(minutes: number | null, isInProgress: boolean): string {
  if (minutes === null) return isInProgress ? "En cours" : "—";
  return `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, "0")}`;
}

function AttendanceModal({
  date,
  row,
  onClose,
  onSave,
}: {
  date: string;
  row: AttendanceRow;
  onClose: () => void;
  onSave: (employeeId: string, input: AttendanceInput) => Promise<void>;
}) {
  const [status, setStatus] = useState<
    Exclude<AttendanceStatus, "NOT_RECORDED">
  >(row.status === "NOT_RECORDED" ? "PRESENT" : row.status);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input: AttendanceInput = {
      date,
      status,
      checkIn:
        status === "PRESENT" || status === "LATE"
          ? String(form.get("checkIn") ?? "") || null
          : null,
      checkOut:
        status === "PRESENT" || status === "LATE"
          ? String(form.get("checkOut") ?? "") || null
          : null,
    };
    setIsSaving(true);
    setError(null);
    try {
      await onSave(row.employeeId, input);
      onClose();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "L’enregistrement a échoué.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={
        row.status === "NOT_RECORDED"
          ? "Saisir la présence"
          : "Modifier le pointage"
      }
      description={`${row.employeeName} · ${row.position} · ${date}`}
      icon={Clock3}
    >
      <form onSubmit={submit} className="space-y-4">
        <label className="field-label">
          Statut de la journée
          <select
            className="field-input"
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
          >
            <option value="PRESENT">Présent</option>
            <option value="LATE">Retard</option>
            <option value="ABSENT">Absent</option>
            <option value="LEAVE">Congé</option>
          </select>
        </label>
        {(status === "PRESENT" || status === "LATE") && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field-label">
              Arrivée
              <input
                className="field-input"
                name="checkIn"
                type="time"
                required
                defaultValue={row.checkIn?.slice(0, 5) ?? ""}
              />
            </label>
            <label className="field-label">
              Départ{" "}
              <span className="font-normal text-slate-400">(facultatif)</span>
              <input
                className="field-input"
                name="checkOut"
                type="time"
                defaultValue={row.checkOut?.slice(0, 5) ?? ""}
              />
            </label>
          </div>
        )}
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
          >
            {error}
          </p>
        )}
        <ModalFooter>
          <SecondaryButton onClick={onClose} disabled={isSaving}>
            Annuler
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={isSaving}>
            {isSaving ? "Enregistrement…" : "Enregistrer"}
          </PrimaryButton>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export function Attendance() {
  const { user } = useAuth();
  const [date, setDate] = useState(localDateValue);
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editingRow, setEditingRow] = useState<AttendanceRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const canManage = Boolean(
    user?.roles.some((role) => ["ADMIN", "HR_MANAGER"].includes(role)),
  );

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    setRows([]);
    const load = async () => {
      try {
        const result = await attendanceApi.daily(accessToken(), date);
        if (active) setRows(result);
      } catch (reason) {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : "Impossible de charger les présences.",
          );
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [date]);

  const filteredRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) =>
      `${row.employeeName} ${row.position}`.toLowerCase().includes(needle),
    );
  }, [rows, query]);

  const saveAttendance = async (employeeId: string, input: AttendanceInput) => {
    const saved = await attendanceApi.save(accessToken(), employeeId, input);
    setRows((current) =>
      current.map((row) => (row.employeeId === employeeId ? saved : row)),
    );
    setNotice(`La présence de ${saved.employeeName} a été enregistrée.`);
    setError(null);
  };

  const metrics = [
    {
      label: "Employés",
      value: rows.length,
      icon: Users,
      tone: "pink" as const,
      detail: "dossiers non archivés",
    },
    {
      label: "Présents",
      value: rows.filter((row) => row.status === "PRESENT").length,
      icon: CheckCheck,
      tone: "green" as const,
      detail: "pointage enregistré",
    },
    {
      label: "Retards",
      value: rows.filter((row) => row.status === "LATE").length,
      icon: Clock3,
      tone: "amber" as const,
      detail: "sur cette journée",
    },
    {
      label: "Absents / congés",
      value: rows.filter(
        (row) => row.status === "ABSENT" || row.status === "LEAVE",
      ).length,
      icon: Users,
      tone: "violet" as const,
      detail: "sur cette journée",
    },
    {
      label: "À saisir",
      value: rows.filter((row) => row.status === "NOT_RECORDED").length,
      icon: Clock3,
      tone: "blue" as const,
      detail: "sans fiche pour cette date",
    },
  ];

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        eyebrow="Personnel"
        title="Présences"
        description="Consultez et saisissez les pointages quotidiens des employés."
        action={
          <label className="field-label w-full md:w-auto">
            Journée
            <input
              className="field-input min-w-44"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
        }
      />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={String(metric.value)}
            icon={metric.icon}
            tone={metric.tone}
            detail={metric.detail}
          />
        ))}
      </section>
      {(error || notice) && (
        <div
          role={error ? "alert" : "status"}
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${error ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-100 bg-emerald-50 text-emerald-700"}`}
        >
          <div className="flex items-center justify-between gap-3">
            <span>{error ?? notice}</span>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setNotice(null);
              }}
              aria-label="Fermer le message"
            >
              ×
            </button>
          </div>
        </div>
      )}
      <section className="surface-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-extrabold">Pointages de la journée</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Les durées sont calculées entre l’arrivée et le départ.
            </p>
          </div>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Rechercher un employé…"
          />
        </div>
        {isLoading ? (
          <p className="p-8 text-center text-sm text-slate-500">
            Chargement des présences…
          </p>
        ) : error ? (
          <p className="p-8 text-center text-sm text-slate-500">
            Impossible de charger les pointages pour cette journée.
          </p>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            Aucun dossier Employé non archivé dans cette organisation.
          </p>
        ) : filteredRows.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            Aucun résultat pour cette recherche.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 dark:border-slate-800">
                  <th className="px-5 py-3">Employé</th>
                  <th className="px-3 py-3">Arrivée</th>
                  <th className="px-3 py-3">Départ</th>
                  <th className="px-3 py-3">Heures</th>
                  <th className="px-3 py-3">Statut</th>
                  {canManage && (
                    <th className="px-5 py-3 text-right">Action</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr
                    key={row.employeeId}
                    className="border-b border-slate-50 text-sm last:border-0 dark:border-slate-800"
                  >
                    <td className="px-5 py-4">
                      <p className="font-bold">{row.employeeName}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {row.position}
                        {row.employeeStatus === "INACTIVE" ? " · Inactif" : ""}
                      </p>
                    </td>
                    <td className="px-3 py-4 font-semibold">
                      {timeLabel(row.checkIn)}
                    </td>
                    <td className="px-3 py-4 font-semibold">
                      {timeLabel(row.checkOut)}
                    </td>
                    <td className="px-3 py-4 font-semibold">
                      {durationLabel(
                        row.workedMinutes,
                        Boolean(row.checkIn && !row.checkOut),
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass(row.status)}`}
                      >
                        {statusLabel(row.status)}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setEditingRow(row)}
                          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        >
                          {row.status === "NOT_RECORDED" ? (
                            <Plus className="h-4 w-4" />
                          ) : (
                            <Clock3 className="h-4 w-4" />
                          )}
                          {row.status === "NOT_RECORDED"
                            ? "Saisir"
                            : "Modifier"}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {editingRow && (
        <AttendanceModal
          key={`${date}-${editingRow.employeeId}`}
          date={date}
          row={editingRow}
          onClose={() => setEditingRow(null)}
          onSave={saveAttendance}
        />
      )}
    </div>
  );
}
