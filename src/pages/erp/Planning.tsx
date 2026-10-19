import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Pencil,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Modal, ModalFooter } from "@/components/erp/Modal";
import {
  MetricCard,
  PageHeader,
  PrimaryButton,
  SearchInput,
  SecondaryButton,
} from "@/components/erp/Ui";
import { StatusBadge } from "@/components/erp/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { ApiError, readAuthSession } from "@/lib/auth";
import type { OrderRecord } from "@/lib/orders";
import {
  productionApi,
  type ProductionScheduleInput,
  type ProductionStage,
  type ProductionTaskRecord,
} from "@/lib/production";

const stages: ProductionStage[] = [
  "À produire",
  "En production",
  "Contrôle qualité",
  "Terminé",
];

function accessToken(): string {
  const session = readAuthSession();
  if (!session) {
    throw new ApiError("Votre session a expiré. Reconnectez-vous.", 401);
  }
  return session.tokens.accessToken;
}

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDueDate(value: string | null): string {
  if (!value) return "Échéance non définie";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function Planning() {
  const { user } = useAuth();
  const canPlan = Boolean(
    user?.roles.some((role) => ["ADMIN", "PRODUCTION_MANAGER"].includes(role)),
  );
  const [tasks, setTasks] = useState<ProductionTaskRecord[]>([]);
  const [availableOrders, setAvailableOrders] = useState<OrderRecord[]>([]);
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<ProductionStage | "ALL">("ALL");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [editingTask, setEditingTask] = useState<ProductionTaskRecord | null>(
    null,
  );
  const [scheduledDate, setScheduledDate] = useState(() => dateKey(new Date()));
  const [scheduledStartTime, setScheduledStartTime] = useState("08:00");
  const [scheduledEndTime, setScheduledEndTime] = useState("09:00");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = accessToken();
      const [taskRows, orderRows] = await Promise.all([
        productionApi.tasks(token),
        canPlan ? productionApi.availableOrders(token) : Promise.resolve([]),
      ]);
      setTasks(taskRows);
      setAvailableOrders(orderRows);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Le planning n’a pas pu être chargé.",
      );
    } finally {
      setLoading(false);
    }
  }, [canPlan]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveSchedule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingTask && !selectedOrderId) return;
    if (scheduledStartTime >= scheduledEndTime) {
      setActionError(
        "L’heure de fin doit être postérieure à l’heure de début.",
      );
      return;
    }
    setSaving(true);
    setActionError(null);
    const schedule: ProductionScheduleInput = {
      scheduledDate,
      scheduledStartTime,
      scheduledEndTime,
    };
    try {
      if (editingTask) {
        const updated = await productionApi.updateSchedule(
          accessToken(),
          editingTask.id,
          schedule,
        );
        setTasks((current) =>
          current.map((task) => (task.id === updated.id ? updated : task)),
        );
        setNotice(`Le créneau de ${updated.orderNumber} a été enregistré.`);
      } else {
        const created = await productionApi.planOrder(
          accessToken(),
          selectedOrderId,
          schedule,
        );
        setTasks((current) => [created, ...current]);
        setAvailableOrders((current) =>
          current.filter((order) => order.id !== selectedOrderId),
        );
        setNotice(`La commande ${created.orderNumber} a été planifiée.`);
      }
      setIsModalOpen(false);
      setEditingTask(null);
      setSelectedOrderId("");
    } catch (reason) {
      setActionError(
        reason instanceof Error
          ? reason.message
          : "La commande n’a pas pu être planifiée.",
      );
    } finally {
      setSaving(false);
    }
  };

  const clearSchedule = async () => {
    if (!editingTask) return;
    setSaving(true);
    setActionError(null);
    try {
      const updated = await productionApi.updateSchedule(
        accessToken(),
        editingTask.id,
        {
          scheduledDate: null,
          scheduledStartTime: null,
          scheduledEndTime: null,
        },
      );
      setTasks((current) =>
        current.map((task) => (task.id === updated.id ? updated : task)),
      );
      setNotice(`Le créneau de ${updated.orderNumber} a été retiré.`);
      setEditingTask(null);
      setIsModalOpen(false);
    } catch (reason) {
      setActionError(
        reason instanceof Error
          ? reason.message
          : "Le créneau n’a pas pu être retiré.",
      );
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("fr");
    return tasks
      .filter(
        (task) =>
          (stage === "ALL" || task.stage === stage) &&
          `${task.orderNumber} ${task.customer} ${task.product} ${task.machine} ${task.operatorName}`
            .toLocaleLowerCase("fr")
            .includes(normalizedQuery),
      )
      .sort((left, right) => {
        if (left.scheduledDate && right.scheduledDate) {
          const dateOrder = left.scheduledDate.localeCompare(
            right.scheduledDate,
          );
          if (dateOrder !== 0) return dateOrder;
          return (left.scheduledStartTime ?? "").localeCompare(
            right.scheduledStartTime ?? "",
          );
        }
        if (left.scheduledDate) return -1;
        if (right.scheduledDate) return 1;
        if (!left.dueDate && !right.dueDate) return 0;
        if (!left.dueDate) return 1;
        if (!right.dueDate) return -1;
        return left.dueDate.localeCompare(right.dueDate);
      });
  }, [query, stage, tasks]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = dateKey(today);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndKey = dateKey(weekEnd);
  const upcomingCount = tasks.filter((task) => {
    const dueDate = task.dueDate?.slice(0, 10);
    return (
      dueDate &&
      dueDate >= todayKey &&
      dueDate <= weekEndKey &&
      task.stage !== "Terminé"
    );
  }).length;
  const scheduledThisWeekCount = tasks.filter((task) => {
    const date = task.scheduledDate?.slice(0, 10);
    return (
      date && date >= todayKey && date <= weekEndKey && task.stage !== "Terminé"
    );
  }).length;
  const unassignedCount = tasks.filter(
    (task) => !task.employeeId && task.stage !== "Terminé",
  ).length;
  const selectedOrder = availableOrders.find(
    (order) => order.id === selectedOrderId,
  );

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        eyebrow="Production"
        title="Planning de production"
        description="Réservez les machines par jour et créneau horaire, puis suivez les commandes et les opérateurs affectés. Les chevauchements de machine et d’opérateur sont refusés."
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/production"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              Suivi de production
            </Link>
            {canPlan && (
              <PrimaryButton
                icon={Plus}
                disabled={loading || availableOrders.length === 0}
                onClick={() => {
                  setActionError(null);
                  setEditingTask(null);
                  setSelectedOrderId(availableOrders[0]?.id ?? "");
                  setScheduledDate(todayKey);
                  setScheduledStartTime("08:00");
                  setScheduledEndTime("09:00");
                  setIsModalOpen(true);
                }}
              >
                Planifier une commande
              </PrimaryButton>
            )}
          </div>
        }
      />
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700"
        >
          <span>{error}</span>
          <button type="button" onClick={() => void load()}>
            Réessayer
          </button>
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"
        >
          {notice}
        </div>
      )}
      {canPlan && availableOrders.length === 0 && !loading && (
        <p className="rounded-xl border border-sky-100 bg-sky-50 p-3 text-sm text-sky-800">
          Aucune commande confirmée n’est disponible pour une nouvelle
          planification.
        </p>
      )}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Tâches planifiées"
          value={loading ? "…" : String(tasks.length)}
          icon={ClipboardList}
          tone="blue"
        />
        <MetricCard
          label="Créneaux réservés sous 7 jours"
          value={loading ? "…" : String(scheduledThisWeekCount)}
          icon={CalendarDays}
          tone="violet"
        />
        <MetricCard
          label="Commandes à échéance sous 7 jours"
          value={loading ? "…" : String(upcomingCount)}
          icon={Clock3}
          tone="blue"
        />
        <MetricCard
          label="Sans opérateur affecté"
          value={loading ? "…" : String(unassignedCount)}
          icon={CheckCircle2}
          tone="amber"
        />
      </section>
      <section className="surface-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Commande, client, produit, machine ou opérateur…"
          />
          <select
            value={stage}
            onChange={(event) =>
              setStage(event.target.value as ProductionStage | "ALL")
            }
            aria-label="Filtrer les tâches par étape"
            className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="ALL">Toutes les étapes</option>
            {stages.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 dark:border-slate-800">
                <th className="px-5 py-3">Échéance</th>
                <th className="px-3 py-3">Créneau machine</th>
                <th className="px-3 py-3">Commande / client</th>
                <th className="px-3 py-3">Produit</th>
                <th className="px-3 py-3">Machine</th>
                <th className="px-3 py-3">Opérateur</th>
                <th className="px-3 py-3">Étape</th>
                <th className="px-5 py-3">Priorité</th>
                {canPlan && <th className="px-5 py-3">Action</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((task) => (
                <tr
                  key={task.id}
                  className="border-b border-slate-50 text-sm dark:border-slate-800"
                >
                  <td className="px-5 py-3.5 font-semibold">
                    {formatDueDate(task.dueDate)}
                  </td>
                  <td className="px-3 py-3.5">
                    {task.scheduledDate &&
                    task.scheduledStartTime &&
                    task.scheduledEndTime ? (
                      <>
                        <b>{formatDueDate(task.scheduledDate)}</b>
                        <span className="block text-xs text-slate-500">
                          {task.scheduledStartTime}–{task.scheduledEndTime}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-amber-700 dark:text-amber-400">
                        À réserver
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3.5">
                    <b>{task.orderNumber}</b>
                    <span className="block text-xs text-slate-500">
                      {task.customer}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    {task.product}
                    <span className="block text-xs text-slate-500">
                      Quantité : {task.quantity}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">{task.machine}</td>
                  <td className="px-3 py-3.5">{task.operatorName}</td>
                  <td className="px-3 py-3.5">
                    <StatusBadge status={task.stage} />
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={task.priority} />
                  </td>
                  {canPlan && (
                    <td className="px-5 py-3.5">
                      {task.stage !== "Terminé" && (
                        <button
                          type="button"
                          onClick={() => {
                            setActionError(null);
                            setEditingTask(task);
                            setScheduledDate(
                              task.scheduledDate?.slice(0, 10) ?? todayKey,
                            );
                            setScheduledStartTime(
                              task.scheduledStartTime ?? "08:00",
                            );
                            setScheduledEndTime(
                              task.scheduledEndTime ?? "09:00",
                            );
                            setIsModalOpen(true);
                          }}
                          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:border-[#ffb0ca] hover:bg-rose-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                          aria-label={`Modifier le créneau de ${task.orderNumber}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Modifier
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={canPlan ? 9 : 8}
                    className="p-8 text-center text-sm text-slate-500"
                  >
                    {tasks.length
                      ? "Aucune tâche ne correspond aux filtres."
                      : "Aucune tâche de production planifiée."}
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td
                    colSpan={canPlan ? 9 : 8}
                    className="p-8 text-center text-sm text-slate-500"
                  >
                    Chargement du planning…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!loading && (
          <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500 dark:border-slate-800">
            {filtered.length} tâche(s) affichée(s) sur {tasks.length}
          </p>
        )}
      </section>
      <Modal
        open={isModalOpen}
        onClose={() => {
          if (!saving) setIsModalOpen(false);
        }}
        title={editingTask ? "Modifier un créneau" : "Planifier une commande"}
        description={
          editingTask
            ? `${editingTask.orderNumber} · ${editingTask.machine}`
            : "La tâche reprend la machine et l’échéance définies sur la commande."
        }
        icon={CalendarDays}
        size="md"
      >
        <form className="space-y-4" onSubmit={saveSchedule}>
          {actionError && (
            <p
              role="alert"
              className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700"
            >
              {actionError}
            </p>
          )}
          {!editingTask && (
            <label className="field-label">
              Commande confirmée
              <select
                required
                value={selectedOrderId}
                onChange={(event) => setSelectedOrderId(event.target.value)}
                className="field-input"
                disabled={saving || availableOrders.length === 0}
              >
                <option value="">Choisir une commande</option>
                {availableOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.orderNumber} · {order.clientName} ·{" "}
                    {order.productName}
                  </option>
                ))}
              </select>
            </label>
          )}
          {!editingTask && selectedOrder && (
            <div className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800">
              <p>
                Machine : <b>{selectedOrder.machine}</b>
              </p>
              <p className="mt-1">
                Échéance : <b>{formatDueDate(selectedOrder.dueDate)}</b>
              </p>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="field-label sm:col-span-1">
              Jour du créneau
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={(event) => setScheduledDate(event.target.value)}
                className="field-input"
                disabled={saving}
              />
            </label>
            <label className="field-label">
              Début
              <input
                type="time"
                required
                value={scheduledStartTime}
                onChange={(event) => setScheduledStartTime(event.target.value)}
                className="field-input"
                disabled={saving}
              />
            </label>
            <label className="field-label">
              Fin
              <input
                type="time"
                required
                value={scheduledEndTime}
                onChange={(event) => setScheduledEndTime(event.target.value)}
                className="field-input"
                disabled={saving}
              />
            </label>
          </div>
          <ModalFooter>
            <SecondaryButton
              disabled={saving}
              onClick={() => setIsModalOpen(false)}
            >
              Annuler
            </SecondaryButton>
            {editingTask?.scheduledDate && (
              <SecondaryButton
                disabled={saving}
                onClick={() => void clearSchedule()}
              >
                Retirer le créneau
              </SecondaryButton>
            )}
            <PrimaryButton
              type="submit"
              icon={CalendarDays}
              disabled={saving || (!editingTask && !selectedOrderId)}
            >
              {saving
                ? "Enregistrement…"
                : editingTask
                  ? "Enregistrer"
                  : "Planifier"}
            </PrimaryButton>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
