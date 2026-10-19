import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Package,
  Plus,
  ShoppingCart,
  Truck,
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
import { purchasesApi, type PurchaseOrderRecord } from "@/lib/purchases";
import { stockApi, type StockItemRecord } from "@/lib/stock";
import { suppliersApi, type SupplierRecord } from "@/lib/suppliers";
import { currencyUnitLabel, formatAr } from "@/utils/format";

interface DraftLine {
  stockItemId: string;
  quantity: string;
  unitCost: string;
}

function getAccessToken(): string {
  const session = readAuthSession();
  if (!session) {
    throw new ApiError("Votre session a expiré. Reconnectez-vous.", 401);
  }
  return session.tokens.accessToken;
}

function formatDate(value: string | null): string {
  if (!value) return "Non définie";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

const inputClassName =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none transition focus:border-[#ff9fbe] focus:ring-4 focus:ring-rose-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-rose-950";

export default function Purchases() {
  const { user } = useAuth();
  const canManage = Boolean(
    user?.roles.some((role) => role === "ADMIN" || role === "STOCK_MANAGER"),
  );
  const [orders, setOrders] = useState<PurchaseOrderRecord[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [stockItems, setStockItems] = useState<StockItemRecord[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!canManage) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      const [orderRows, supplierRows, itemRows] = await Promise.all([
        purchasesApi.list(token),
        suppliersApi.list(token),
        stockApi.list(token),
      ]);
      setOrders(orderRows);
      setSuppliers(supplierRows);
      setStockItems(itemRows);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Les commandes fournisseurs n’ont pas pu être chargées.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [canManage]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredOrders = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return orders;
    return orders.filter((order) =>
      `${order.purchaseNumber} ${order.supplierName} ${order.notes ?? ""} ${order.lines
        .map((line) => `${line.itemName} ${line.itemReference}`)
        .join(" ")}`
        .toLowerCase()
        .includes(needle),
    );
  }, [orders, query]);

  const orderedTotal = orders.reduce((sum, order) => sum + order.total, 0);
  const orderedCount = orders.filter(
    (order) => order.status !== "RECEIVED",
  ).length;
  const draftTotal = lines.reduce((sum, line) => {
    const quantity = Number(line.quantity) || 0;
    const unitCost = Number(line.unitCost) || 0;
    return sum + quantity * unitCost;
  }, 0);

  const openCreateModal = () => {
    const firstItem = stockItems[0];
    setSupplierId(suppliers[0]?.id ?? "");
    setLines(
      firstItem
        ? [
            {
              stockItemId: firstItem.id,
              quantity: "1",
              unitCost: String(firstItem.unitCost ?? 0),
            },
          ]
        : [],
    );
    setActionError(null);
    setIsModalOpen(true);
  };

  const addLine = () => {
    const nextItem = stockItems.find(
      (item) => !lines.some((line) => line.stockItemId === item.id),
    );
    if (!nextItem) return;
    setLines((current) => [
      ...current,
      {
        stockItemId: nextItem.id,
        quantity: "1",
        unitCost: String(nextItem.unitCost ?? 0),
      },
    ]);
  };

  const changeLine = (index: number, field: keyof DraftLine, value: string) => {
    setLines((current) =>
      current.map((line, lineIndex) => {
        if (lineIndex !== index) return line;
        if (field === "stockItemId") {
          const item = stockItems.find((candidate) => candidate.id === value);
          return {
            ...line,
            stockItemId: value,
            unitCost: String(item?.unitCost ?? 0),
          };
        }
        return { ...line, [field]: value };
      }),
    );
  };

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const normalizedLines = lines.map((line) => ({
      stockItemId: line.stockItemId,
      quantity: Number(line.quantity),
      unitCost: Number(line.unitCost),
    }));
    if (
      !supplierId ||
      normalizedLines.length === 0 ||
      normalizedLines.some(
        (line) =>
          !line.stockItemId ||
          !Number.isInteger(line.quantity) ||
          line.quantity < 1 ||
          line.quantity > 4_294_967_295 ||
          !Number.isFinite(line.unitCost) ||
          line.unitCost < 0 ||
          Math.round(line.unitCost * 100) !== line.unitCost * 100,
      )
    ) {
      setActionError(
        "Choisissez un fournisseur et vérifiez les articles, quantités et prix.",
      );
      return;
    }

    setIsSaving(true);
    setActionError(null);
    try {
      const expectedDate = String(values.get("expectedDate") ?? "");
      const notes = String(values.get("notes") ?? "").trim();
      const created = await purchasesApi.create(getAccessToken(), {
        supplierId,
        ...(expectedDate ? { expectedDate } : {}),
        notes: notes || null,
        lines: normalizedLines,
      });
      setOrders((current) => [created, ...current]);
      setNotice(
        `${created.purchaseNumber} a été créée pour ${created.supplierName}.`,
      );
      setIsModalOpen(false);
    } catch (reason) {
      setActionError(
        reason instanceof Error
          ? reason.message
          : "La commande fournisseur n’a pas pu être enregistrée.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!canManage) {
    return (
      <div className="page-enter space-y-6">
        <PageHeader
          eyebrow="Approvisionnement"
          title="Achats"
          description="La gestion des commandes fournisseurs est réservée aux responsables de stock et aux administrateurs."
        />
        <div
          role="alert"
          className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-semibold text-amber-800"
        >
          Votre rôle ne permet pas de consulter les achats de cette
          organisation.
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        eyebrow="Approvisionnement"
        title="Commandes fournisseurs"
        description="Préparez les achats par fournisseur et suivez les quantités et coûts prévus avant leur réception."
        action={
          <PrimaryButton
            icon={Plus}
            onClick={openCreateModal}
            disabled={isLoading || !suppliers.length || !stockItems.length}
          >
            Nouvelle commande
          </PrimaryButton>
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
      {!isLoading && (!suppliers.length || !stockItems.length) && (
        <p className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
          Ajoutez au moins un fournisseur et un article dans Stock avant de
          créer une commande fournisseur.
        </p>
      )}
      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Commandes enregistrées"
          value={isLoading ? "…" : String(orders.length)}
          icon={ClipboardList}
          tone="blue"
          detail="Historique de cette organisation"
        />
        <MetricCard
          label="En cours"
          value={isLoading ? "…" : String(orderedCount)}
          icon={Truck}
          tone="amber"
          detail="En attente de réception"
        />
        <MetricCard
          label="Montant commandé"
          value={isLoading ? "…" : formatAr(orderedTotal)}
          icon={ShoppingCart}
          tone="violet"
          detail="Total des commandes en cours"
        />
      </section>
      <section className="surface-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="N° commande, fournisseur, article…"
          />
          <p className="text-xs font-semibold text-slate-500">
            {isLoading ? "Chargement…" : `${filteredOrders.length} commande(s)`}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 dark:border-slate-800">
                <th className="w-10 px-4 py-3" aria-label="Détails" />
                <th className="px-3 py-3">Commande</th>
                <th className="px-3 py-3">Fournisseur</th>
                <th className="px-3 py-3">Lignes</th>
                <th className="px-3 py-3">Livraison prévue</th>
                <th className="px-3 py-3">Montant</th>
                <th className="px-5 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
              {filteredOrders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                const statusLabel =
                  order.status === "RECEIVED"
                    ? "Reçue"
                    : order.status === "PARTIALLY_RECEIVED"
                      ? "Partiellement reçue"
                      : "Commandée";
                const statusClassName =
                  order.status === "RECEIVED"
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                    : order.status === "PARTIALLY_RECEIVED"
                      ? "bg-amber-50 text-amber-700 ring-amber-100"
                      : "bg-blue-50 text-blue-700 ring-blue-100";
                return (
                  <Fragment key={order.id}>
                    <tr className="text-slate-600 dark:text-slate-300">
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                          aria-label={
                            isExpanded
                              ? "Masquer les lignes"
                              : "Afficher les lignes"
                          }
                          aria-expanded={isExpanded}
                          onClick={() =>
                            setExpandedOrderId(isExpanded ? null : order.id)
                          }
                        >
                          {isExpanded ? (
                            <ChevronDown size={17} />
                          ) : (
                            <ChevronRight size={17} />
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-4">
                        <p className="font-extrabold text-slate-800 dark:text-slate-100">
                          {order.purchaseNumber}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Créée le {formatDate(order.createdAt)}
                        </p>
                      </td>
                      <td className="px-3 py-4 font-bold text-slate-800 dark:text-slate-100">
                        {order.supplierName}
                      </td>
                      <td className="px-3 py-4">{order.lineCount}</td>
                      <td className="px-3 py-4">
                        {formatDate(order.expectedDate)}
                      </td>
                      <td className="px-3 py-4 font-extrabold text-slate-800 dark:text-slate-100">
                        {formatAr(order.total)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${statusClassName}`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${order.id}-lines`}>
                        <td
                          colSpan={7}
                          className="bg-slate-50/80 px-5 py-4 dark:bg-slate-950/40"
                        >
                          <div className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                            <Package size={15} /> Détail de la commande
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[620px] text-left text-xs">
                              <thead className="text-[10px] uppercase tracking-wider text-slate-400">
                                <tr>
                                  <th className="py-2">Article</th>
                                  <th className="px-3 py-2">Référence</th>
                                  <th className="px-3 py-2">Quantité</th>
                                  <th className="px-3 py-2">
                                    Reçue / restante
                                  </th>
                                  <th className="px-3 py-2">Coût unitaire</th>
                                  <th className="py-2 text-right">
                                    Total ligne
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                                {order.lines.map((line) => (
                                  <tr key={line.id}>
                                    <td className="py-3 font-bold text-slate-700 dark:text-slate-200">
                                      {line.itemName}
                                    </td>
                                    <td className="px-3 py-3">
                                      {line.itemReference}
                                    </td>
                                    <td className="px-3 py-3">
                                      {line.quantityOrdered} {line.unit}
                                    </td>
                                    <td className="px-3 py-3">
                                      {line.quantityReceived} reçue ·{" "}
                                      {line.quantityRemaining} restante
                                    </td>
                                    <td className="px-3 py-3">
                                      {formatAr(line.unitCost)}
                                    </td>
                                    <td className="py-3 text-right font-bold">
                                      {formatAr(line.total)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {order.notes && (
                            <p className="mt-3 whitespace-pre-wrap text-xs text-slate-500">
                              Note : {order.notes}
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {!isLoading && filteredOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-sm text-slate-500"
                  >
                    {orders.length
                      ? "Aucune commande ne correspond à la recherche."
                      : "Aucune commande fournisseur enregistrée."}
                  </td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-sm text-slate-500"
                  >
                    Chargement des commandes…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={isModalOpen}
        onClose={() => !isSaving && setIsModalOpen(false)}
        title="Nouvelle commande fournisseur"
        description="Les prix sont enregistrés sur la commande. Ils ne modifient pas automatiquement le coût de l’article en stock."
        icon={ShoppingCart}
        size="lg"
      >
        <form className="space-y-5" onSubmit={submitOrder}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-bold text-slate-700 dark:text-slate-200">
              Fournisseur
              <select
                className={inputClassName}
                value={supplierId}
                onChange={(event) => setSupplierId(event.target.value)}
                required
              >
                <option value="">Choisir un fournisseur</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-bold text-slate-700 dark:text-slate-200">
              Livraison prévue
              <span className="relative block">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="expectedDate"
                  type="date"
                  className={`${inputClassName} pl-10`}
                />
              </span>
            </label>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                Articles commandés
              </h3>
              <SecondaryButton
                onClick={addLine}
                disabled={
                  lines.length >= stockItems.length || lines.length >= 100
                }
              >
                Ajouter un article
              </SecondaryButton>
            </div>
            {lines.map((line, index) => {
              const availableItems = stockItems.filter(
                (item) =>
                  item.id === line.stockItemId ||
                  !lines.some(
                    (other, otherIndex) =>
                      otherIndex !== index && other.stockItemId === item.id,
                  ),
              );
              return (
                <div
                  key={`${line.stockItemId}-${index}`}
                  className="grid gap-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-700 sm:grid-cols-[minmax(0,1fr)_110px_150px_44px] sm:items-end"
                >
                  <label className="space-y-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                    Article de stock
                    <select
                      className={inputClassName}
                      value={line.stockItemId}
                      onChange={(event) =>
                        changeLine(index, "stockItemId", event.target.value)
                      }
                      required
                    >
                      {availableItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} · {item.reference}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                    Quantité
                    <input
                      className={inputClassName}
                      type="number"
                      min="1"
                      max="4294967295"
                      step="1"
                      value={line.quantity}
                      onChange={(event) =>
                        changeLine(index, "quantity", event.target.value)
                      }
                      required
                    />
                  </label>
                  <label className="space-y-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                    Coût unitaire ({currencyUnitLabel()})
                    <input
                      className={inputClassName}
                      type="number"
                      min="0"
                      max="999999999999.99"
                      step="0.01"
                      value={line.unitCost}
                      onChange={(event) =>
                        changeLine(index, "unitCost", event.target.value)
                      }
                      required
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setLines((current) =>
                        current.filter((_, lineIndex) => lineIndex !== index),
                      )
                    }
                    disabled={lines.length <= 1}
                    aria-label="Retirer cet article"
                    className="flex h-11 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-rose-950/30"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
          <label className="block space-y-1.5 text-sm font-bold text-slate-700 dark:text-slate-200">
            Note interne
            <textarea
              name="notes"
              rows={3}
              maxLength={2000}
              className={`${inputClassName} resize-y`}
              placeholder="Conditions ou précision de livraison…"
            />
          </label>
          <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/70">
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
              Total estimé
            </span>
            <span className="text-lg font-extrabold text-slate-900 dark:text-white">
              {formatAr(draftTotal)}
            </span>
          </div>
          {actionError && (
            <p
              role="alert"
              className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700"
            >
              {actionError}
            </p>
          )}
          <ModalFooter>
            <SecondaryButton
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
            >
              Annuler
            </SecondaryButton>
            <PrimaryButton
              type="submit"
              icon={Plus}
              disabled={isSaving || !suppliers.length || !stockItems.length}
            >
              {isSaving ? "Enregistrement…" : "Créer la commande"}
            </PrimaryButton>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
