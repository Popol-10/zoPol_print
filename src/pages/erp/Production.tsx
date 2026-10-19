import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Play,
  Plus,
  ShieldCheck,
  Timer,
  UserRoundCog,
} from "lucide-react";
import { ApiError, readAuthSession } from "@/lib/auth";
import {
  productionApi,
  type ProductionStage,
  type ProductionTaskRecord,
} from "@/lib/production";
import type { OrderRecord } from "@/lib/orders";
import { employeesApi, type EmployeeRecord } from "@/lib/employees";
import { useAuth } from "@/hooks/useAuth";
import {
  MetricCard,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  SectionHeading,
} from "@/components/erp/Ui";
import { Modal, ModalFooter } from "@/components/erp/Modal";
import { StatusBadge } from "@/components/erp/StatusBadge";

const stages: ProductionStage[] = [
  "À produire",
  "En production",
  "Contrôle qualité",
  "Terminé",
];
const stageTone: Record<ProductionStage, string> = {
  "À produire": "bg-violet-500",
  "En production": "bg-amber-500",
  "Contrôle qualité": "bg-blue-500",
  Terminé: "bg-emerald-500",
};

function errorMessage(reason: unknown, fallback: string): string {
  return reason instanceof ApiError || reason instanceof Error
    ? reason.message
    : fallback;
}

function accessToken(): string {
  const session = readAuthSession();
  if (!session)
    throw new ApiError("Votre session a expiré. Reconnectez-vous.", 401);
  return session.tokens.accessToken;
}

function formatDate(value: string | null): string {
  if (!value) return "Échéance à définir";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function isOverdue(task: ProductionTaskRecord): boolean {
  if (!task.dueDate || task.stage === "Terminé") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${task.dueDate.slice(0, 10)}T00:00:00`) < today;
}

function TaskCard({
  task,
  canAssign,
  canAdvance,
  onAssign,
  onAdvance,
}: {
  task: ProductionTaskRecord;
  canAssign: boolean;
  canAdvance: boolean;
  onAssign: (task: ProductionTaskRecord) => void;
  onAdvance: (task: ProductionTaskRecord) => void;
}) {
  const nextStage = stages[stages.indexOf(task.stage) + 1];
  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-extrabold">{task.orderNumber}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">{task.customer}</p>
        </div>
        <StatusBadge status={task.priority} />
      </div>
      <p className="mt-3 line-clamp-1 text-sm font-bold">{task.product}</p>
      <p className="mt-1 text-xs text-slate-500">
        ×{task.quantity} · {task.machine}
      </p>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500 dark:border-slate-800">
        <span className="truncate">{task.operatorName}</span>
        <span
          className={
            isOverdue(task)
              ? "shrink-0 font-semibold text-rose-600"
              : "shrink-0 font-semibold"
          }
        >
          {formatDate(task.dueDate)}
        </span>
      </div>
      {(canAssign || (canAdvance && nextStage)) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {canAssign ? (
            <SecondaryButton
              className="min-h-9 px-2.5 py-1.5 text-xs"
              icon={UserRoundCog}
              onClick={() => onAssign(task)}
            >
              Affecter
            </SecondaryButton>
          ) : null}
          {canAdvance && nextStage ? (
            <PrimaryButton
              className="min-h-9 flex-1 px-2.5 py-1.5 text-xs"
              onClick={() => onAdvance(task)}
            >
              Passer à {nextStage} <ArrowRight className="h-3 w-3" />
            </PrimaryButton>
          ) : null}
        </div>
      )}
    </article>
  );
}

export default function Production() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<ProductionTaskRecord[]>([]);
  const [availableOrders, setAvailableOrders] = useState<OrderRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [machine, setMachine] = useState("Toutes les machines");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [assignmentTask, setAssignmentTask] =
    useState<ProductionTaskRecord | null>(null);
  const [assignmentEmployeeId, setAssignmentEmployeeId] = useState("");
  const canPlan = Boolean(
    user?.roles.some((role) => ["ADMIN", "PRODUCTION_MANAGER"].includes(role)),
  );
  const canAssign = canPlan;
  const canAdvance = Boolean(
    user?.roles.some((role) =>
      ["ADMIN", "PRODUCTION_MANAGER", "OPERATOR"].includes(role),
    ),
  );

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = accessToken();
        const [taskRows, orderRows, employeeRows] = await Promise.all([
          productionApi.tasks(token),
          canPlan ? productionApi.availableOrders(token) : Promise.resolve([]),
          canPlan ? employeesApi.list(token) : Promise.resolve([]),
        ]);
        if (!active) return;
        setTasks(taskRows);
        setAvailableOrders(orderRows);
        setEmployees(employeeRows);
      } catch (reason) {
        if (active)
          setError(
            errorMessage(reason, "Impossible de charger la production."),
          );
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [canPlan]);

  const machines = useMemo(
    () => [
      "Toutes les machines",
      ...new Set(tasks.map((task) => task.machine).filter(Boolean)),
    ],
    [tasks],
  );
  const filtered = useMemo(
    () =>
      tasks.filter(
        (task) => machine === "Toutes les machines" || task.machine === machine,
      ),
    [tasks, machine],
  );
  const overdueCount = tasks.filter(isOverdue).length;
  const machineQueues = useMemo(() => {
    const groups = new Map<string, ProductionTaskRecord[]>();
    for (const task of tasks) {
      const queue = groups.get(task.machine) ?? [];
      queue.push(task);
      groups.set(task.machine, queue);
    }
    return [...groups.entries()].map(([name, rows]) => ({
      name,
      active: rows.filter((task) => task.stage !== "Terminé").length,
      quality: rows.filter((task) => task.stage === "Contrôle qualité").length,
    }));
  }, [tasks]);

  const planOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedOrderId) return;
    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      const task = await productionApi.planOrder(
        accessToken(),
        selectedOrderId,
      );
      setTasks((current) => [...current, task]);
      setAvailableOrders((current) =>
        current.filter((order) => order.id !== selectedOrderId),
      );
      setIsPlanOpen(false);
      setSelectedOrderId("");
      setNotice(`La commande ${task.orderNumber} est ajoutée au planning.`);
    } catch (reason) {
      setError(errorMessage(reason, "La planification a échoué."));
    } finally {
      setIsSaving(false);
    }
  };

  const saveAssignment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!assignmentTask) return;
    setIsSaving(true);
    setError(null);
    try {
      const updated = await productionApi.assign(
        accessToken(),
        assignmentTask.id,
        assignmentEmployeeId === "__clear__" ? null : assignmentEmployeeId,
      );
      setTasks((current) =>
        current.map((task) => (task.id === updated.id ? updated : task)),
      );
      setAssignmentTask(null);
      setNotice(
        updated.employeeId
          ? `${updated.operatorName} est affecté(e) à la commande ${updated.orderNumber}.`
          : `La commande ${updated.orderNumber} n’a plus d’employé affecté.`,
      );
    } catch (reason) {
      setError(errorMessage(reason, "L’affectation a échoué."));
    } finally {
      setIsSaving(false);
    }
  };

  const advanceTask = async (task: ProductionTaskRecord) => {
    const nextStage = stages[stages.indexOf(task.stage) + 1];
    if (!nextStage) return;
    setError(null);
    setNotice(null);
    try {
      const updated = await productionApi.updateStage(
        accessToken(),
        task.id,
        nextStage,
      );
      setTasks((current) =>
        current.map((row) => (row.id === updated.id ? updated : row)),
      );
      setNotice(
        `${updated.orderNumber} est passée à l’étape « ${updated.stage} ».`,
      );
    } catch (reason) {
      setError(errorMessage(reason, "La mise à jour de l’étape a échoué."));
    }
  };

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        eyebrow="Production"
        title="Atelier en production"
        description="Planifiez les commandes confirmées, affectez un opérateur et suivez les étapes de fabrication."
        action={
          canPlan ? (
            <PrimaryButton icon={Plus} onClick={() => setIsPlanOpen(true)}>
              Planifier une commande
            </PrimaryButton>
          ) : undefined
        }
      />
      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-200"
        >
          {error}
        </p>
      ) : null}
      {notice ? (
        <p
          role="status"
          className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          {notice}
        </p>
      ) : null}
      <section className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          label="À produire"
          value={`${tasks.filter((task) => task.stage === "À produire").length}`}
          icon={Clock3}
          tone="violet"
          detail="commandes planifiées"
        />
        <MetricCard
          label="En cours"
          value={`${tasks.filter((task) => task.stage === "En production").length}`}
          icon={Play}
          tone="amber"
          detail="opérations actives"
        />
        <MetricCard
          label="Contrôle qualité"
          value={`${tasks.filter((task) => task.stage === "Contrôle qualité").length}`}
          icon={ShieldCheck}
          tone="blue"
          detail="à valider"
        />
        <MetricCard
          label="Terminées"
          value={`${tasks.filter((task) => task.stage === "Terminé").length}`}
          icon={CheckCircle2}
          tone="green"
          detail="dans le planning"
        />
        <MetricCard
          label="En retard"
          value={`${overdueCount}`}
          icon={Timer}
          tone="pink"
          detail="échéance dépassée"
        />
      </section>
      <section className="surface-card p-5">
        <SectionHeading
          title="Tâches par machine"
          description="Nombre de tâches enregistrées dans chaque file de production"
          action={
            <select
              value={machine}
              onChange={(event) => setMachine(event.target.value)}
              aria-label="Filtrer par machine"
              className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              {machines.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          }
        />
        {machineQueues.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {machineQueues.map((item) => (
              <div
                key={item.name}
                className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"
              >
                <b className="text-sm">{item.name}</b>
                <p className="mt-2 text-xs text-slate-500">
                  {item.active} tâche(s) non terminée(s) · {item.quality} en
                  contrôle qualité
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            Aucune tâche de production enregistrée.
          </p>
        )}
      </section>
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#ff226d]">
              Flux opérationnel
            </p>
            <h2 className="text-lg font-extrabold">Tableau de production</h2>
          </div>
          <p className="hidden text-xs text-slate-500 sm:block">
            Les étapes modifiées ici sont aussi reportées sur la commande.
          </p>
        </div>
        {isLoading ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Chargement du planning…
          </p>
        ) : (
          <div className="grid min-w-0 gap-4 xl:grid-cols-4">
            {stages.map((stage) => {
              const rows = filtered.filter((task) => task.stage === stage);
              return (
                <div
                  key={stage}
                  className="min-h-[280px] rounded-2xl bg-slate-100/75 p-3 dark:bg-slate-900"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <i
                        className={`h-2.5 w-2.5 rounded-full ${stageTone[stage]}`}
                      />
                      <h3 className="text-xs font-extrabold">{stage}</h3>
                    </div>
                    <span className="rounded-md bg-white px-2 py-0.5 text-[11px] font-bold text-slate-500 dark:bg-slate-800">
                      {rows.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {rows.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        canAssign={canAssign}
                        canAdvance={canAdvance}
                        onAssign={(selected) => {
                          setAssignmentTask(selected);
                          setAssignmentEmployeeId(
                            selected.employeeId ??
                              (selected.operatorName === "À attribuer"
                                ? "__clear__"
                                : "__legacy__"),
                          );
                        }}
                        onAdvance={(selected) => void advanceTask(selected)}
                      />
                    ))}
                    {!rows.length && (
                      <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400 dark:border-slate-700">
                        Aucune tâche
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      <Modal
        open={isPlanOpen}
        onClose={() => setIsPlanOpen(false)}
        title="Planifier une commande"
        description="Seules les commandes confirmées sans tâche de production sont proposées."
        icon={Plus}
      >
        <form onSubmit={(event) => void planOrder(event)} className="space-y-4">
          {availableOrders.length ? (
            <label className="field-label">
              Commande confirmée
              <select
                required
                value={selectedOrderId}
                onChange={(event) => setSelectedOrderId(event.target.value)}
                className="field-input"
              >
                <option value="">Sélectionner une commande</option>
                {availableOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.orderNumber} ·{" "}
                    {order.clientCompany || order.clientName} ·{" "}
                    {order.productName} (×{order.quantity})
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800">
              Aucune commande confirmée n’est disponible pour le moment.
            </p>
          )}
          <ModalFooter>
            <SecondaryButton onClick={() => setIsPlanOpen(false)}>
              Fermer
            </SecondaryButton>
            <PrimaryButton
              type="submit"
              disabled={isSaving || !availableOrders.length}
            >
              {isSaving ? "Planification…" : "Ajouter au planning"}
            </PrimaryButton>
          </ModalFooter>
        </form>
      </Modal>
      <Modal
        open={Boolean(assignmentTask)}
        onClose={() => setAssignmentTask(null)}
        title="Affecter un opérateur"
        description={
          assignmentTask
            ? `Commande ${assignmentTask.orderNumber} · ${assignmentTask.product}`
            : undefined
        }
        icon={UserRoundCog}
      >
        <form
          onSubmit={(event) => void saveAssignment(event)}
          className="space-y-4"
        >
          <label className="field-label">
            Employé responsable
            <select
              value={assignmentEmployeeId}
              onChange={(event) => setAssignmentEmployeeId(event.target.value)}
              className="field-input"
              required
            >
              {assignmentEmployeeId === "__legacy__" && assignmentTask && (
                <option value="__legacy__" disabled>
                  Nom historique non lié : {assignmentTask.operatorName}
                </option>
              )}
              <option value="__clear__">Désaffecter la tâche</option>
              {employees
                .filter((employee) => employee.status === "ACTIVE")
                .map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} · {employee.position}
                  </option>
                ))}
              {assignmentTask?.employeeId &&
                !employees.some(
                  (employee) =>
                    employee.id === assignmentTask.employeeId &&
                    employee.status === "ACTIVE",
                ) && (
                  <option value={assignmentTask.employeeId} disabled>
                    {assignmentTask.operatorName} · inactif
                  </option>
                )}
            </select>
          </label>
          {assignmentEmployeeId === "__legacy__" && (
            <p className="text-xs text-amber-700">
              Ce nom historique n’est pas lié à un dossier. Choisissez un
              employé du répertoire ou désaffectez la tâche.
            </p>
          )}
          {employees.every((employee) => employee.status !== "ACTIVE") && (
            <p className="text-xs text-slate-500">
              Aucun employé actif à affecter. Ajoutez ou réactivez un dossier
              dans Employés.
            </p>
          )}
          <ModalFooter>
            <SecondaryButton onClick={() => setAssignmentTask(null)}>
              Annuler
            </SecondaryButton>
            <PrimaryButton
              type="submit"
              disabled={
                isSaving ||
                assignmentEmployeeId === "__legacy__" ||
                (assignmentEmployeeId !== "__clear__" &&
                  !employees.some(
                    (employee) =>
                      employee.id === assignmentEmployeeId &&
                      employee.status === "ACTIVE",
                  ))
              }
            >
              {isSaving ? "Enregistrement…" : "Enregistrer l’affectation"}
            </PrimaryButton>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
