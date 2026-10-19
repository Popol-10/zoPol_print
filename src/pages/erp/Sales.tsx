import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileText, Plus, ShoppingCart } from "lucide-react";
import { OrderFormModal } from "@/components/erp/OrderFormModal";
import {
  MetricCard,
  PageHeader,
  PrimaryButton,
  SearchInput,
} from "@/components/erp/Ui";
import { StatusBadge } from "@/components/erp/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { ApiError, readAuthSession } from "@/lib/auth";
import {
  ordersApi,
  type CreateOrderInput,
  type OrderRecord,
  type OrderStatus,
} from "@/lib/orders";
import { formatAr } from "@/utils/format";

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

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function Sales() {
  const { user } = useAuth();
  const canCreate = Boolean(
    user?.roles.some((role) => role === "ADMIN" || role === "COMMERCIAL"),
  );
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<OrderStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const session = readAuthSession();
      if (!session) {
        throw new ApiError("Votre session a expiré. Reconnectez-vous.", 401);
      }
      setOrders(await ordersApi.list(session.tokens.accessToken));
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Les ventes n’ont pas pu être chargées.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveSale = async (input: CreateOrderInput) => {
    const session = readAuthSession();
    if (!session) {
      throw new ApiError("Votre session a expiré. Reconnectez-vous.", 401);
    }
    const created = await ordersApi.create(session.tokens.accessToken, input);
    setOrders((current) => [created, ...current]);
    setError(null);
    setSuccess(`La vente ${created.orderNumber} a été enregistrée.`);
  };

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("fr");
    return orders.filter(
      (order) =>
        (status === "ALL" || order.status === status) &&
        `${order.orderNumber} ${order.clientName} ${order.productName}`
          .toLocaleLowerCase("fr")
          .includes(normalizedQuery),
    );
  }, [orders, query, status]);

  const paidTotal = orders.reduce((sum, order) => sum + order.paidAmount, 0);
  const remainingTotal = orders.reduce(
    (sum, order) => sum + Math.max(0, order.total - order.paidAmount),
    0,
  );
  const orderedTotal = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        eyebrow="Commerce"
        title="Ventes"
        description="Consultez les commandes clients et les montants réellement encaissés. Les ventes sont enregistrées dans le module Commandes."
        action={
          canCreate ? (
            <PrimaryButton
              icon={Plus}
              disabled={loading}
              onClick={() => setIsOrderModalOpen(true)}
            >
              Enregistrer une vente
            </PrimaryButton>
          ) : null
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
      {success && (
        <div
          role="status"
          className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"
        >
          {success}
        </div>
      )}
      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Commandes commerciales"
          value={loading ? "…" : String(orders.length)}
          icon={ShoppingCart}
          tone="blue"
          detail="Toutes les commandes de l’organisation"
        />
        <MetricCard
          label="Montant commandé"
          value={loading ? "…" : formatAr(orderedTotal)}
          icon={FileText}
          tone="violet"
          detail="Total calculé depuis les commandes"
        />
        <MetricCard
          label="Encaissé · reste à recevoir"
          value={loading ? "…" : formatAr(paidTotal)}
          icon={CheckCircle2}
          tone="green"
          detail={loading ? "…" : `${formatAr(remainingTotal)} restant`}
        />
      </section>
      <section className="surface-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="N° commande, client ou produit…"
          />
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as OrderStatus | "ALL")
            }
            aria-label="Filtrer les ventes par statut"
            className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="ALL">Tous les statuts</option>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 dark:border-slate-800">
                <th className="px-5 py-3">Commande / date</th>
                <th className="px-3 py-3">Client / produit</th>
                <th className="px-3 py-3">Statut</th>
                <th className="px-3 py-3 text-right">Montant</th>
                <th className="px-3 py-3 text-right">Encaissé</th>
                <th className="px-5 py-3 text-right">Reste à recevoir</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-slate-50 text-sm dark:border-slate-800"
                >
                  <td className="px-5 py-3.5">
                    <b>{order.orderNumber}</b>
                    <span className="block text-xs text-slate-500">
                      {formatDate(order.orderedAt)}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <b>{order.clientName}</b>
                    <span className="block text-xs text-slate-500">
                      {order.productName} · ×{order.quantity}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-3 py-3.5 text-right font-bold">
                    {formatAr(order.total)}
                  </td>
                  <td className="px-3 py-3.5 text-right font-semibold text-emerald-700">
                    {formatAr(order.paidAmount)}
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold">
                    {formatAr(Math.max(0, order.total - order.paidAmount))}
                  </td>
                </tr>
              ))}
              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-slate-500">
                    {orders.length
                      ? "Aucune vente ne correspond aux filtres."
                      : "Aucune commande client enregistrée."}
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-slate-500">
                    Chargement des ventes…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!loading && (
          <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500 dark:border-slate-800">
            {filtered.length} vente(s) affichée(s) sur {orders.length}
          </p>
        )}
      </section>
      <OrderFormModal
        open={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSave={saveSale}
      />
    </div>
  );
}
