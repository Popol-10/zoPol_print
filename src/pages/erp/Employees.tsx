import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Archive, Mail, Pencil, Phone, Plus, Users } from "lucide-react";
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
  employeesApi,
  type EmployeeInput,
  type EmployeeRecord,
  type EmployeeStatus,
} from "@/lib/employees";

function getAccessToken(): string {
  const session = readAuthSession();
  if (!session)
    throw new ApiError("Votre session a expiré. Reconnectez-vous.", 401);
  return session.tokens.accessToken;
}

function employeeError(reason: unknown): string {
  return reason instanceof Error
    ? reason.message
    : "Une erreur est survenue lors de l’opération.";
}

function EmployeeFormModal({
  open,
  employee,
  onClose,
  onSave,
}: {
  open: boolean;
  employee: EmployeeRecord | null;
  onClose: () => void;
  onSave: (
    employeeId: string | null,
    input: EmployeeInput,
    status?: EmployeeStatus,
  ) => Promise<void>;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input: EmployeeInput = {
      name: String(form.get("name") ?? "").trim(),
      position: String(form.get("position") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim() || null,
      email: String(form.get("email") ?? "").trim() || null,
    };
    const status = employee
      ? (String(form.get("status")) as EmployeeStatus)
      : undefined;
    setIsSaving(true);
    setError(null);
    try {
      await onSave(employee?.id ?? null, input, status);
      onClose();
    } catch (reason) {
      setError(employeeError(reason));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={employee ? "Modifier un employé" : "Ajouter un employé"}
      description={
        employee
          ? "Mettez à jour les coordonnées et le statut du dossier."
          : "Créez un dossier dans l’annuaire de votre organisation."
      }
      icon={Users}
    >
      <form onSubmit={submit} className="space-y-4">
        <label className="field-label">
          Nom complet
          <input
            className="field-input"
            name="name"
            required
            minLength={2}
            maxLength={160}
            autoFocus
            defaultValue={employee?.name ?? ""}
          />
        </label>
        <label className="field-label">
          Poste
          <input
            className="field-input"
            name="position"
            required
            minLength={2}
            maxLength={120}
            placeholder="Ex. Opérateur DTF"
            defaultValue={employee?.position ?? ""}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field-label">
            Téléphone{" "}
            <span className="font-normal text-slate-400">(facultatif)</span>
            <input
              className="field-input"
              name="phone"
              maxLength={40}
              type="tel"
              defaultValue={employee?.phone ?? ""}
            />
          </label>
          <label className="field-label">
            E-mail{" "}
            <span className="font-normal text-slate-400">(facultatif)</span>
            <input
              className="field-input"
              name="email"
              maxLength={190}
              type="email"
              defaultValue={employee?.email ?? ""}
            />
          </label>
        </div>
        {employee && (
          <label className="field-label">
            Statut
            <select
              className="field-input"
              name="status"
              defaultValue={employee.status}
            >
              <option value="ACTIVE">Actif</option>
              <option value="INACTIVE">Inactif</option>
            </select>
          </label>
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
            {isSaving
              ? "Enregistrement…"
              : employee
                ? "Enregistrer"
                : "Ajouter l’employé"}
          </PrimaryButton>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export function Employees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRecord | null>(
    null,
  );
  const [archiveTarget, setArchiveTarget] = useState<EmployeeRecord | null>(
    null,
  );
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const canManage = Boolean(
    user?.roles.some((role) => ["ADMIN", "HR_MANAGER"].includes(role)),
  );

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const records = await employeesApi.list(getAccessToken());
        if (active) setEmployees(records);
      } catch (reason) {
        if (active) setError(employeeError(reason));
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return employees.filter((employee) =>
      `${employee.name} ${employee.position} ${employee.email ?? ""} ${employee.phone ?? ""}`
        .toLowerCase()
        .includes(needle),
    );
  }, [employees, query]);

  const saveEmployee = async (
    employeeId: string | null,
    input: EmployeeInput,
    status?: EmployeeStatus,
  ) => {
    if (employeeId) {
      const updated = await employeesApi.update(getAccessToken(), employeeId, {
        ...input,
        ...(status ? { status } : {}),
      });
      setEmployees((current) =>
        current
          .map((employee) => (employee.id === updated.id ? updated : employee))
          .sort((a, b) => a.name.localeCompare(b.name, "fr")),
      );
      setNotice(`Le dossier de ${updated.name} a été modifié.`);
    } else {
      const created = await employeesApi.create(getAccessToken(), input);
      setEmployees((current) =>
        [...current, created].sort((a, b) =>
          a.name.localeCompare(b.name, "fr"),
        ),
      );
      setNotice(`${created.name} a été ajouté(e) à l’annuaire.`);
    }
    setError(null);
  };

  const archiveEmployee = async () => {
    if (!archiveTarget) return;
    setIsArchiving(true);
    try {
      await employeesApi.archive(getAccessToken(), archiveTarget.id);
      setEmployees((current) =>
        current.filter((employee) => employee.id !== archiveTarget.id),
      );
      setNotice(`Le dossier de ${archiveTarget.name} a été archivé.`);
      setArchiveTarget(null);
      setError(null);
    } catch (reason) {
      setError(employeeError(reason));
    } finally {
      setIsArchiving(false);
    }
  };

  const activeCount = employees.filter(
    (employee) => employee.status === "ACTIVE",
  ).length;

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        eyebrow="Personnel"
        title="Employés"
        description="Consultez les dossiers de l’équipe et gérez l’annuaire de votre organisation."
        action={
          canManage ? (
            <PrimaryButton
              icon={Plus}
              onClick={() => {
                setEditingEmployee(null);
                setIsModalOpen(true);
              }}
            >
              Ajouter un employé
            </PrimaryButton>
          ) : undefined
        }
      />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Dossiers actifs"
          value={String(activeCount)}
          icon={Users}
          tone="pink"
          detail="dans cette organisation"
        />
        <MetricCard
          label="Dossiers affichés"
          value={String(filtered.length)}
          icon={Users}
          tone="blue"
          detail="selon la recherche"
        />
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
            <h2 className="font-extrabold">Annuaire de l’équipe</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Les données sont enregistrées dans le backend.
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
            Chargement de l’annuaire…
          </p>
        ) : error && employees.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            L’annuaire n’a pas pu être chargé.
          </p>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">
              {query ? "Aucun résultat." : "Aucun employé enregistré."}
            </p>
            {!query && canManage && (
              <p className="mt-1 text-xs text-slate-500">
                Ajoutez le premier dossier avec le bouton ci-dessus.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 dark:border-slate-800">
                  <th className="px-5 py-3">Employé</th>
                  <th className="px-3 py-3">Coordonnées</th>
                  <th className="px-3 py-3">Statut</th>
                  {canManage && (
                    <th className="px-5 py-3 text-right">Action</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((employee) => (
                  <tr
                    key={employee.id}
                    className="border-b border-slate-50 text-sm last:border-0 dark:border-slate-800"
                  >
                    <td className="px-5 py-4">
                      <p className="font-bold">{employee.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {employee.position}
                      </p>
                    </td>
                    <td className="px-3 py-4 text-xs text-slate-500">
                      <div className="space-y-1">
                        {employee.email && (
                          <p className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" />
                            {employee.email}
                          </p>
                        )}
                        {employee.phone && (
                          <p className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" />
                            {employee.phone}
                          </p>
                        )}
                        {!employee.email && !employee.phone && (
                          <span>Coordonnées non renseignées</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${employee.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
                      >
                        {employee.status === "ACTIVE" ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingEmployee(employee);
                              setIsModalOpen(true);
                            }}
                            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                            aria-label={`Modifier ${employee.name}`}
                          >
                            <Pencil className="h-4 w-4" /> Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => setArchiveTarget(employee)}
                            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                            aria-label={`Archiver ${employee.name}`}
                          >
                            <Archive className="h-4 w-4" /> Archiver
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <EmployeeFormModal
        open={isModalOpen}
        employee={editingEmployee}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEmployee(null);
        }}
        onSave={saveEmployee}
      />
      <Modal
        open={archiveTarget !== null}
        onClose={() => !isArchiving && setArchiveTarget(null)}
        title="Archiver le dossier ?"
        description={
          archiveTarget
            ? `Le dossier de ${archiveTarget.name} sera retiré de l’annuaire actif.`
            : undefined
        }
        icon={Archive}
        size="sm"
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          L’historique sera conservé et le dossier ne sera plus affiché dans la
          liste.
        </p>
        <ModalFooter>
          <SecondaryButton
            onClick={() => setArchiveTarget(null)}
            disabled={isArchiving}
          >
            Annuler
          </SecondaryButton>
          <PrimaryButton
            onClick={() => void archiveEmployee()}
            disabled={isArchiving}
          >
            {isArchiving ? "Archivage…" : "Archiver"}
          </PrimaryButton>
        </ModalFooter>
      </Modal>
    </div>
  );
}
