import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  Banknote,
  CalendarDays,
  CircleDollarSign,
  Pencil,
  Users,
} from "lucide-react";
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
  payrollApi,
  type CompensationInput,
  type CompensationRecord,
} from "@/lib/payroll";
import { currencyUnitLabel, formatAr } from "@/utils/format";

function accessToken(): string {
  const session = readAuthSession();
  if (!session) {
    throw new ApiError("Votre session a expiré. Reconnectez-vous.", 401);
  }
  return session.tokens.accessToken;
}

function errorMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : "Une erreur est survenue.";
}

function localDateValue(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function effectiveDateLabel(value: string | null): string {
  if (!value) return "Non renseignée";
  const date = new Date(value.slice(0, 10) + "T00:00:00");
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function CompensationModal({
  record,
  onClose,
  onSave,
}: {
  record: CompensationRecord;
  onClose: () => void;
  onSave: (input: CompensationInput) => Promise<void>;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const input: CompensationInput = {
      monthlyBaseSalary: Number(values.get("monthlyBaseSalary")),
      effectiveFrom: String(values.get("effectiveFrom") ?? ""),
    };
    setIsSaving(true);
    setError(null);
    try {
      await onSave(input);
      onClose();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={
        record.monthlyBaseSalary === null
          ? "Renseigner le salaire"
          : "Modifier le salaire"
      }
      description={record.employeeName + " · " + record.position}
      icon={Banknote}
    >
      <form onSubmit={submit} className="space-y-4">
        <label className="field-label">
          Salaire mensuel de base ({currencyUnitLabel()})
          <input
            className="field-input"
            name="monthlyBaseSalary"
            type="number"
            min={1}
            max={1000000000}
            step={1}
            required
            autoFocus
            defaultValue={record.monthlyBaseSalary ?? ""}
          />
        </label>
        <label className="field-label">
          Date d’effet
          <input
            className="field-input"
            name="effectiveFrom"
            type="date"
            required
            defaultValue={record.effectiveFrom ?? localDateValue()}
          />
        </label>
        <p className="text-xs leading-5 text-slate-500">
          Ce montant est enregistré dans le dossier de rémunération, séparé de
          l’annuaire Employés.
        </p>
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

export function Remuneration() {
  const { user } = useAuth();
  const [records, setRecords] = useState<CompensationRecord[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CompensationRecord | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const canManage = Boolean(
    user?.roles.some((role) => ["ADMIN", "HR_MANAGER"].includes(role)),
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setRecords(await payrollApi.salaries(accessToken()));
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("fr");
    return records.filter((record) =>
      (record.employeeName + " " + record.position)
        .toLocaleLowerCase("fr")
        .includes(needle),
    );
  }, [records, query]);

  const active = records.filter((record) => record.employeeStatus === "ACTIVE");
  const configured = active.filter(
    (record) => record.monthlyBaseSalary !== null,
  );
  const monthlyTotal = configured.reduce(
    (total, record) => total + (record.monthlyBaseSalary ?? 0),
    0,
  );

  const metrics = [
    {
      label: "Employés actifs",
      value: String(active.length),
      icon: Users,
      tone: "pink" as const,
      detail: "dans l’annuaire",
    },
    {
      label: "Salaires renseignés",
      value: String(configured.length),
      icon: Banknote,
      tone: "blue" as const,
      detail: "sur " + active.length + " employés actifs",
    },
    {
      label: "Base mensuelle",
      value: formatAr(monthlyTotal),
      icon: CircleDollarSign,
      tone: "green" as const,
      detail: "salaires de base actifs",
    },
    {
      label: "À renseigner",
      value: String(active.length - configured.length),
      icon: CalendarDays,
      tone: "amber" as const,
      detail: "employés actifs sans montant",
    },
  ];

  const saveCompensation = async (
    record: CompensationRecord,
    input: CompensationInput,
  ) => {
    setIsSaving(true);
    setError(null);
    try {
      const updated = await payrollApi.setSalary(
        accessToken(),
        record.employeeId,
        input,
      );
      setRecords((current) =>
        current.map((item) =>
          item.employeeId === updated.employeeId ? updated : item,
        ),
      );
      setNotice("Le salaire de " + updated.employeeName + " a été enregistré.");
      setEditingRecord(null);
    } catch (reason) {
      setError(errorMessage(reason));
      throw reason;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        eyebrow="Personnel"
        title="Rémunération"
        description="Consultez les salaires mensuels de base et leurs dates d’effet."
      />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>
      {(error || notice) && (
        <div
          role={error ? "alert" : "status"}
          className={
            "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-bold " +
            (error
              ? "border-rose-100 bg-rose-50 text-rose-700"
              : "border-emerald-100 bg-emerald-50 text-emerald-700")
          }
        >
          <span>{error ?? notice}</span>
          {error ? (
            <SecondaryButton onClick={() => void load()} disabled={isLoading}>
              Réessayer
            </SecondaryButton>
          ) : (
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Fermer"
            >
              ×
            </button>
          )}
        </div>
      )}
      <section className="surface-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-extrabold">Salaires de base</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {isLoading ? "Chargement…" : filtered.length + " dossier(s)"}
            </p>
          </div>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Rechercher un employé…"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 dark:border-slate-800">
                <th className="px-5 py-3">Employé</th>
                <th className="px-3 py-3">Poste</th>
                <th className="px-3 py-3">Salaire mensuel de base</th>
                <th className="px-3 py-3">Date d’effet</th>
                <th className="px-3 py-3">Statut</th>
                {canManage && <th className="px-5 py-3 text-right">Action</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr
                  key={record.employeeId}
                  className="border-b border-slate-50 text-sm dark:border-slate-800"
                >
                  <td className="px-5 py-4 font-bold">{record.employeeName}</td>
                  <td className="px-3 py-4 text-xs text-slate-500">
                    {record.position}
                  </td>
                  <td className="px-3 py-4 font-bold">
                    {record.monthlyBaseSalary === null
                      ? "À renseigner"
                      : formatAr(record.monthlyBaseSalary)}
                  </td>
                  <td className="px-3 py-4 text-xs text-slate-500">
                    {effectiveDateLabel(record.effectiveFrom)}
                  </td>
                  <td className="px-3 py-4">
                    <span
                      className={
                        "rounded-full px-2.5 py-1 text-xs font-bold " +
                        (record.employeeStatus === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300")
                      }
                    >
                      {record.employeeStatus === "ACTIVE" ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-5 py-4 text-right">
                      {record.employeeStatus === "ACTIVE" && (
                        <button
                          type="button"
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-[#ff226d] dark:hover:bg-slate-800"
                          aria-label={
                            (record.monthlyBaseSalary === null
                              ? "Renseigner"
                              : "Modifier") +
                            " le salaire de " +
                            record.employeeName
                          }
                          onClick={() => setEditingRecord(record)}
                        >
                          <Pencil className="inline h-4 w-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={canManage ? 6 : 5}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    {query
                      ? "Aucun employé ne correspond à la recherche."
                      : "Aucun dossier Employé disponible."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {editingRecord && (
        <CompensationModal
          record={editingRecord}
          onClose={() => !isSaving && setEditingRecord(null)}
          onSave={(input) => saveCompensation(editingRecord, input)}
        />
      )}
    </div>
  );
}
