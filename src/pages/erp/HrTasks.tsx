import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  Archive,
  CalendarDays,
  CheckCheck,
  ClipboardCheck,
  Clock3,
  ListTodo,
  Pencil,
  Plus,
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
import { employeesApi, type EmployeeRecord } from "@/lib/employees";
import {
  hrTasksApi,
  type HrTaskInput,
  type HrTaskRecord,
  type HrTaskStatus,
} from "@/lib/hr-tasks";

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

function taskStatusLabel(status: HrTaskStatus): string {
  return {
    TODO: "À faire",
    IN_PROGRESS: "En cours",
    COMPLETED: "Terminée",
  }[status];
}

function taskStatusClass(status: HrTaskStatus): string {
  return {
    TODO: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    IN_PROGRESS: "bg-amber-50 text-amber-700",
    COMPLETED: "bg-emerald-50 text-emerald-700",
  }[status];
}

function dateLabel(value: string): string {
  const date = new Date(value.slice(0, 10) + "T00:00:00");
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function isOverdue(task: HrTaskRecord): boolean {
  return (
    task.status !== "COMPLETED" && task.dueDate.slice(0, 10) < localDateValue()
  );
}

function HrTaskModal({
  task,
  employees,
  onClose,
  onSave,
}: {
  task: HrTaskRecord | null;
  employees: EmployeeRecord[];
  onClose: () => void;
  onSave: (input: HrTaskInput, status?: HrTaskStatus) => Promise<void>;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const input: HrTaskInput = {
      title: String(values.get("title") ?? "").trim(),
      description: String(values.get("description") ?? "").trim() || null,
      dueDate: String(values.get("dueDate") ?? ""),
      employeeId: String(values.get("employeeId") ?? "") || null,
    };
    const status = task
      ? (String(values.get("status")) as HrTaskStatus)
      : undefined;
    setIsSaving(true);
    setError(null);
    try {
      await onSave(input, status);
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
      title={task ? "Modifier la tâche" : "Nouvelle tâche"}
      description={
        task
          ? "Modifiez la consigne, son responsable ou son avancement."
          : "Créez une tâche pour l’équipe de votre organisation."
      }
      icon={ClipboardCheck}
    >
      <form onSubmit={submit} className="space-y-4">
        <label className="field-label">
          Tâche
          <input
            className="field-input"
            name="title"
            required
            minLength={2}
            maxLength={160}
            autoFocus
            defaultValue={task?.title ?? ""}
            placeholder="Ex. Préparer les commandes du jour"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field-label">
            Responsable
            <select
              className="field-input"
              name="employeeId"
              defaultValue={task?.employeeId ?? ""}
            >
              <option value="">Non attribuée</option>
              {task?.employeeId &&
                !employees.some(
                  (employee) => employee.id === task.employeeId,
                ) && (
                  <option value={task.employeeId} disabled>
                    {task.employeeName ?? "Employé archivé"} · affectation
                    actuelle
                  </option>
                )}
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} · {employee.position}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Échéance
            <input
              className="field-input"
              name="dueDate"
              type="date"
              required
              defaultValue={task?.dueDate.slice(0, 10) ?? localDateValue()}
            />
          </label>
        </div>
        {task && (
          <label className="field-label">
            Avancement
            <select
              className="field-input"
              name="status"
              defaultValue={task.status}
            >
              <option value="TODO">À faire</option>
              <option value="IN_PROGRESS">En cours</option>
              <option value="COMPLETED">Terminée</option>
            </select>
          </label>
        )}
        <label className="field-label">
          Consignes{" "}
          <span className="font-normal text-slate-400">(facultatif)</span>
          <textarea
            className="field-input min-h-24 resize-y"
            name="description"
            maxLength={2000}
            defaultValue={task?.description ?? ""}
            placeholder="Informations utiles pour réaliser la tâche…"
          />
        </label>
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
              : task
                ? "Enregistrer"
                : "Créer la tâche"}
          </PrimaryButton>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export function HrTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<HrTaskRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<HrTaskRecord | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<HrTaskRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const canManage = Boolean(
    user?.roles.some((role) => ["ADMIN", "HR_MANAGER"].includes(role)),
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = accessToken();
      const [taskRows, employeeRows] = await Promise.all([
        hrTasksApi.list(token),
        employeesApi.list(token),
      ]);
      setTasks(taskRows);
      setEmployees(
        employeeRows.filter((employee) => employee.status === "ACTIVE"),
      );
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredTasks = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("fr");
    return tasks.filter((task) =>
      (
        task.title +
        " " +
        (task.employeeName ?? "") +
        " " +
        (task.description ?? "")
      )
        .toLocaleLowerCase("fr")
        .includes(needle),
    );
  }, [tasks, query]);

  const metrics = [
    {
      label: "Tâches actives",
      value: String(tasks.filter((task) => task.status !== "COMPLETED").length),
      icon: ListTodo,
      tone: "pink" as const,
      detail: "dans l’atelier",
    },
    {
      label: "À faire",
      value: String(tasks.filter((task) => task.status === "TODO").length),
      icon: ClipboardCheck,
      tone: "blue" as const,
      detail: "à démarrer",
    },
    {
      label: "En cours",
      value: String(
        tasks.filter((task) => task.status === "IN_PROGRESS").length,
      ),
      icon: Clock3,
      tone: "amber" as const,
      detail: "en réalisation",
    },
    {
      label: "Terminées",
      value: String(tasks.filter((task) => task.status === "COMPLETED").length),
      icon: CheckCheck,
      tone: "green" as const,
      detail: "tâches clôturées",
    },
  ];

  const saveTask = async (input: HrTaskInput, status?: HrTaskStatus) => {
    setIsSaving(true);
    setError(null);
    try {
      const token = accessToken();
      if (editingTask) {
        const updated = await hrTasksApi.update(token, editingTask.id, {
          ...input,
          ...(status ? { status } : {}),
        });
        setTasks((current) =>
          current.map((task) => (task.id === updated.id ? updated : task)),
        );
        setNotice("La tâche « " + updated.title + " » a été mise à jour.");
      } else {
        const created = await hrTasksApi.create(token, input);
        setTasks((current) =>
          [...current, created].sort((a, b) =>
            a.dueDate.localeCompare(b.dueDate),
          ),
        );
        setNotice("La tâche « " + created.title + " » a été créée.");
      }
      setEditorOpen(false);
      setEditingTask(null);
    } catch (reason) {
      setError(errorMessage(reason));
      throw reason;
    } finally {
      setIsSaving(false);
    }
  };

  const archiveTask = async () => {
    if (!archiveTarget) return;
    setIsSaving(true);
    setError(null);
    try {
      await hrTasksApi.archive(accessToken(), archiveTarget.id);
      setTasks((current) =>
        current.filter((task) => task.id !== archiveTarget.id),
      );
      setNotice("La tâche « " + archiveTarget.title + " » a été archivée.");
      setArchiveTarget(null);
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        eyebrow="Personnel"
        title="Tâches"
        description="Répartissez et suivez les tâches de l’équipe avec leurs échéances."
        action={
          canManage ? (
            <PrimaryButton
              icon={Plus}
              onClick={() => {
                setEditingTask(null);
                setEditorOpen(true);
              }}
            >
              Nouvelle tâche
            </PrimaryButton>
          ) : undefined
        }
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
            <h2 className="font-extrabold">Tâches de l’équipe</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {isLoading ? "Chargement…" : filteredTasks.length + " tâche(s)"}
            </p>
          </div>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Rechercher une tâche ou un employé…"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 dark:border-slate-800">
                <th className="px-5 py-3">Tâche</th>
                <th className="px-3 py-3">Responsable</th>
                <th className="px-3 py-3">Échéance</th>
                <th className="px-3 py-3">Avancement</th>
                {canManage && <th className="px-5 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-b border-slate-50 text-sm dark:border-slate-800"
                >
                  <td className="max-w-[360px] px-5 py-4">
                    <p className="font-bold">{task.title}</p>
                    {task.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                        {task.description}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <Users className="h-4 w-4 text-slate-400" />
                      {task.employeeName ?? "Non attribuée"}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <span
                      className={
                        "inline-flex items-center gap-1.5 text-xs font-semibold " +
                        (isOverdue(task)
                          ? "text-rose-600"
                          : "text-slate-600 dark:text-slate-300")
                      }
                    >
                      <CalendarDays className="h-4 w-4" />
                      {dateLabel(task.dueDate)}
                      {isOverdue(task) && <b>· En retard</b>}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <span
                      className={
                        "rounded-full px-2.5 py-1 text-xs font-bold " +
                        taskStatusClass(task.status)
                      }
                    >
                      {taskStatusLabel(task.status)}
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-[#ff226d] dark:hover:bg-slate-800"
                          aria-label={"Modifier " + task.title}
                          onClick={() => {
                            setEditingTask(task);
                            setEditorOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                          aria-label={"Archiver " + task.title}
                          onClick={() => setArchiveTarget(task)}
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {!isLoading && filteredTasks.length === 0 && (
                <tr>
                  <td
                    colSpan={canManage ? 5 : 4}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    {query
                      ? "Aucune tâche ne correspond à la recherche."
                      : "Aucune tâche enregistrée pour le moment."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {editorOpen && (
        <HrTaskModal
          task={editingTask}
          employees={employees}
          onClose={() => {
            if (!isSaving) {
              setEditorOpen(false);
              setEditingTask(null);
            }
          }}
          onSave={saveTask}
        />
      )}
      <Modal
        open={Boolean(archiveTarget)}
        onClose={() => !isSaving && setArchiveTarget(null)}
        title="Archiver la tâche ?"
        description={
          archiveTarget
            ? "« " +
              archiveTarget.title +
              " » ne figurera plus dans la liste active."
            : undefined
        }
        icon={Archive}
        size="sm"
      >
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
          La tâche reste conservée dans l’historique de l’organisation.
        </p>
        {error && (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
            {error}
          </p>
        )}
        <ModalFooter>
          <SecondaryButton
            onClick={() => setArchiveTarget(null)}
            disabled={isSaving}
          >
            Annuler
          </SecondaryButton>
          <PrimaryButton onClick={() => void archiveTask()} disabled={isSaving}>
            {isSaving ? "Archivage…" : "Archiver"}
          </PrimaryButton>
        </ModalFooter>
      </Modal>
    </div>
  );
}
