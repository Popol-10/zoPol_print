import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  ChevronRight,
  ClipboardList,
  Plus,
  X,
} from "lucide-react";
import type { OrderStatus } from "@/types/erp";
import {
  ordersApi,
  type CreateOrderInput,
  type OrderRecord,
} from "@/lib/orders";
import { ApiError, readAuthSession } from "@/lib/auth";
import { financeApi, type FinanceOrderPaymentInput } from "@/lib/finance";
import { OrderPaymentModal } from "@/components/erp/OrderPaymentModal";
import { useAuth } from "@/hooks/useAuth";
import { formatAr } from "@/utils/format";
import {
  MetricCard,
  PageHeader,
  PrimaryButton,
  SearchInput,
} from "@/components/erp/Ui";
import { StatusBadge } from "@/components/erp/StatusBadge";
import { OrderFormModal } from "@/components/erp/OrderFormModal";
import { OverlayDrawer } from "@/components/erp/OverlayDrawer";

const statusOptions: OrderStatus[] = [
  "Nouveau",
  "Confirmé",
  "À produire",
  "En production",
  "Contrôle qualité",
  "Prêt",
  "Livré",
  "Terminé",
  "En attente",
  "Bloqué",
  "Annulé",
];
const timelineSteps: OrderStatus[] = [
  "Nouveau",
  "Confirmé",
  "À produire",
  "En production",
  "Contrôle qualité",
  "Prêt",
  "Livré",
  "Terminé",
];

function errorMessage(reason: unknown, fallback: string): string {
  return reason instanceof ApiError || reason instanceof Error
    ? reason.message
    : fallback;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDueDate(value: string | null): string {
  if (!value) return "À définir";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function OrderDetail({
  order,
  canUpdate,
  canReceivePayment,
  update,
  receivePayment,
  onClose,
}: {
  order: OrderRecord;
  canUpdate: boolean;
  canReceivePayment: boolean;
  update: (status: OrderStatus) => Promise<void>;
  receivePayment: (input: FinanceOrderPaymentInput) => Promise<void>;
  onClose: () => void;
}) {
  const step = timelineSteps.indexOf(order.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const isFinal = order.status === "Terminé" || order.status === "Annulé";

  const changeStatus = async (next: OrderStatus) => {
    try {
      setIsUpdating(true);
      setUpdateError(null);
      await update(next);
    } catch (reason) {
      setUpdateError(
        errorMessage(reason, "La mise à jour du statut a échoué."),
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const advance = timelineSteps[Math.max(0, step) + 1] ?? "Terminé";

  return (
    <OverlayDrawer
      open
      onClose={onClose}
      label={`Détails de la commande ${order.orderNumber}`}
      size="lg"
      contentClassName="p-6"
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer les détails de la commande"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        >
          <X className="h-5 w-5" />
        </button>
        <StatusBadge status={order.status} />
      </div>
      <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#ff226d]">
            Commande
          </p>
          <h2 className="mt-1 text-2xl font-extrabold">{order.orderNumber}</h2>
          <p className="mt-1 text-sm text-slate-500">
            Créée le {formatDate(order.orderedAt)} · échéance{" "}
            {formatDueDate(order.dueDate)}
          </p>
        </div>
        {canUpdate ? (
          <select
            value={order.status}
            disabled={isUpdating}
            onChange={(event) =>
              void changeStatus(event.target.value as OrderStatus)
            }
            aria-label="Modifier le statut de la commande"
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      {updateError ? (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-200"
        >
          {updateError}
        </p>
      ) : null}
      <div className="mt-8 overflow-x-auto">
        <div className="flex min-w-[620px] items-start">
          {timelineSteps.map((item, index) => (
            <div key={item} className="flex flex-1 items-start last:flex-none">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold ${step >= index ? "bg-[#ff226d] text-white" : "bg-slate-100 text-slate-400 dark:bg-slate-800"}`}
                >
                  {step >= index ? "✓" : index + 1}
                </span>
                <span className="mt-1.5 whitespace-nowrap text-[10px] font-semibold text-slate-500">
                  {item}
                </span>
              </div>
              {index < timelineSteps.length - 1 ? (
                <i
                  className={`mt-4 h-0.5 flex-1 ${step > index ? "bg-[#ff9fbe]" : "bg-slate-100 dark:bg-slate-800"}`}
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
          <h3 className="font-extrabold">Client</h3>
          <p className="mt-3 text-sm font-bold">{order.clientName}</p>
          <p className="mt-1 text-xs text-slate-500">
            {order.clientCompany ?? "Client particulier"}
          </p>
        </section>
        <section className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
          <h3 className="font-extrabold">Production</h3>
          <dl className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-400">Machine prévue</dt>
              <dd className="text-right font-bold">{order.machine}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-400">Opérateur</dt>
              <dd className="text-right font-bold">{order.operatorName}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-400">Priorité</dt>
              <dd>
                <StatusBadge status={order.priority} />
              </dd>
            </div>
          </dl>
        </section>
      </div>
      <section className="mt-5 rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
        <h3 className="font-extrabold">Produit commandé</h3>
        <div className="mt-3 flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
          <div className="min-w-0">
            <p className="font-bold">{order.productName}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Réf. {order.productReference} · {order.quantity} ×{" "}
              {formatAr(order.unitPrice)}
            </p>
          </div>
          <b className="shrink-0 text-sm">{formatAr(order.total)}</b>
        </div>
      </section>
      <section className="mt-5 rounded-2xl bg-slate-900 p-4 text-white">
        <div className="flex justify-between text-sm">
          <span className="text-slate-300">Montant total</span>
          <b>{formatAr(order.total)}</b>
        </div>
        <div className="mt-2 flex justify-between text-sm">
          <span className="text-slate-300">Déjà réglé</span>
          <b className="text-emerald-300">{formatAr(order.paidAmount)}</b>
        </div>
        <div className="mt-3 flex justify-between border-t border-white/15 pt-3">
          <span className="font-bold">Reste à payer</span>
          <b className="text-lg text-rose-300">
            {formatAr(order.total - order.paidAmount)}
          </b>
        </div>
        {canReceivePayment && order.total > order.paidAmount ? (
          <button
            type="button"
            onClick={() => setPaymentOpen(true)}
            className="mt-4 w-full rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-slate-900 transition hover:bg-rose-50"
          >
            Enregistrer un paiement
          </button>
        ) : null}
      </section>
      <div className="mt-5 flex justify-end gap-2">
        <PrimaryButton
          icon={ArrowRight}
          disabled={!canUpdate || isUpdating || isFinal}
          onClick={() => void changeStatus(advance)}
        >
          {isUpdating ? "Mise à jour…" : "Avancer l’étape"}
        </PrimaryButton>
      </div>
      <OrderPaymentModal
        open={paymentOpen}
        orderNumber={order.orderNumber}
        remaining={Math.max(0, order.total - order.paidAmount)}
        onClose={() => setPaymentOpen(false)}
        onSave={receivePayment}
      />
    </OverlayDrawer>
  );
}

export default function Orders() {
  const { user } = useAuth();
  const [list, setList] = useState<OrderRecord[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Tous les statuts");
  const [selected, setSelected] = useState<OrderRecord | null>(null);
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const canCreate = Boolean(
    user?.roles.some((role) => role === "ADMIN" || role === "COMMERCIAL"),
  );
  const canReceivePayment = Boolean(
    user?.roles.some((role) =>
      ["ADMIN", "ACCOUNTANT", "COMMERCIAL"].includes(role),
    ),
  );
  const canUpdate = Boolean(
    user?.roles.some((role) =>
      ["ADMIN", "COMMERCIAL", "PRODUCTION_MANAGER", "OPERATOR"].includes(role),
    ),
  );

  useEffect(() => {
    let active = true;
    const loadOrders = async () => {
      const session = readAuthSession();
      if (!session) {
        setError(
          "Votre session a expiré. Reconnectez-vous pour voir les commandes.",
        );
        setIsLoading(false);
        return;
      }
      try {
        const rows = await ordersApi.list(session.tokens.accessToken);
        if (active) setList(rows);
      } catch (reason) {
        if (active)
          setError(
            errorMessage(reason, "Impossible de charger les commandes."),
          );
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void loadOrders();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return list.filter(
      (order) =>
        (status === "Tous les statuts" || order.status === status) &&
        `${order.orderNumber} ${order.clientName} ${order.productName}`
          .toLowerCase()
          .includes(normalizedQuery),
    );
  }, [list, query, status]);

  const saveOrder = async (input: CreateOrderInput) => {
    const session = readAuthSession();
    if (!session)
      throw new ApiError("Votre session a expiré. Reconnectez-vous.", 401);
    const created = await ordersApi.create(session.tokens.accessToken, input);
    setList((current) => [created, ...current]);
    setSuccess(`La commande ${created.orderNumber} a été créée.`);
  };

  const receivePayment = async (input: FinanceOrderPaymentInput) => {
    if (!selected) return;
    const session = readAuthSession();
    if (!session)
      throw new ApiError("Votre session a expiré. Reconnectez-vous.", 401);
    const updated = await financeApi.createOrderPayment(
      session.tokens.accessToken,
      selected.id,
      input,
    );
    setList((current) =>
      current.map((order) => (order.id === updated.id ? updated : order)),
    );
    setSelected(updated);
    setSuccess(`Paiement enregistré pour ${updated.orderNumber}.`);
  };

  const updateStatus = async (nextStatus: OrderStatus) => {
    if (!selected) return;
    const session = readAuthSession();
    if (!session)
      throw new ApiError("Votre session a expiré. Reconnectez-vous.", 401);
    const updated = await ordersApi.updateStatus(
      session.tokens.accessToken,
      selected.id,
      nextStatus,
    );
    setList((current) =>
      current.map((order) => (order.id === updated.id ? updated : order)),
    );
    setSelected(updated);
    setSuccess(`Le statut de ${updated.orderNumber} a été modifié.`);
  };

  const newThisWeek = list.filter((order) => {
    const createdAt = new Date(order.createdAt).getTime();
    const elapsed = Date.now() - createdAt;
    return elapsed >= 0 && elapsed <= 7 * 24 * 60 * 60 * 1000;
  }).length;
  const inProduction = list.filter((order) =>
    ["À produire", "En production", "Contrôle qualité"].includes(order.status),
  ).length;
  const pendingPayment = list.reduce(
    (total, order) => total + Math.max(0, order.total - order.paidAmount),
    0,
  );

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        eyebrow="Commerce"
        title="Commandes"
        description="Suivez le paiement, la production et la livraison de chaque commande."
        action={
          canCreate ? (
            <PrimaryButton
              icon={Plus}
              disabled={isLoading}
              onClick={() => setIsOrderFormOpen(true)}
            >
              Nouvelle commande
            </PrimaryButton>
          ) : null
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
      {success ? (
        <p
          role="status"
          className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          {success}
        </p>
      ) : null}
      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Nouvelles cette semaine"
          value={String(newThisWeek)}
          icon={ClipboardList}
          tone="blue"
        />
        <MetricCard
          label="À produire"
          value={String(inProduction)}
          icon={CalendarClock}
          tone="violet"
        />
        <MetricCard
          label="En attente de paiement"
          value={formatAr(pendingPayment)}
          icon={ClipboardList}
          tone="pink"
        />
      </section>
      <div className="surface-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 lg:flex-row lg:justify-between">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="N° commande, client, produit..."
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Filtrer par statut"
            className="h-10 max-w-[220px] rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <option>Tous les statuts</option>
            {statusOptions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1060px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 dark:border-slate-800">
                <th className="px-5 py-3">Commande</th>
                <th className="px-3 py-3">Client / produit</th>
                <th className="px-3 py-3">Montant</th>
                <th className="px-3 py-3">Paiement</th>
                <th className="px-3 py-3">Production</th>
                <th className="px-3 py-3">Priorité</th>
                <th className="px-3 py-3">Échéance</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-slate-50 text-sm hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/50"
                >
                  <td className="px-5 py-3.5">
                    <p className="font-extrabold">{order.orderNumber}</p>
                    <p className="text-[11px] text-slate-400">
                      {formatDate(order.orderedAt)}
                    </p>
                  </td>
                  <td className="px-3 py-3.5">
                    <p className="font-bold">{order.clientName}</p>
                    <p className="max-w-[190px] truncate text-xs text-slate-500">
                      {order.productName} · ×{order.quantity}
                    </p>
                  </td>
                  <td className="px-3 py-3.5 font-bold">
                    {formatAr(order.total)}
                  </td>
                  <td className="px-3 py-3.5">
                    <p className="text-xs font-bold text-emerald-600">
                      {formatAr(order.paidAmount)}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      reste {formatAr(order.total - order.paidAmount)}
                    </p>
                  </td>
                  <td className="px-3 py-3.5">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-3 py-3.5">
                    <StatusBadge status={order.priority} />
                  </td>
                  <td className="px-3 py-3.5 text-xs font-semibold">
                    <span className="flex items-center gap-1.5">
                      <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                      {formatDueDate(order.dueDate)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() => setSelected(order)}
                      className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-[#ff226d] hover:bg-rose-50"
                    >
                      Détail <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    {list.length === 0
                      ? "Aucune commande pour le moment."
                      : "Aucune commande ne correspond à votre recherche."}
                  </td>
                </tr>
              ) : null}
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    Chargement des commandes…
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
      {selected ? (
        <OrderDetail
          order={selected}
          canUpdate={canUpdate}
          canReceivePayment={canReceivePayment}
          update={updateStatus}
          receivePayment={receivePayment}
          onClose={() => setSelected(null)}
        />
      ) : null}
      <OrderFormModal
        open={isOrderFormOpen}
        onClose={() => setIsOrderFormOpen(false)}
        onSave={saveOrder}
      />
    </div>
  );
}
