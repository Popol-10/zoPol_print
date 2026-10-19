import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PackagePlus } from "lucide-react";
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
  purchasesApi,
  type PurchaseOrderRecord,
  type PurchaseReceiptRecord,
} from "@/lib/purchases";
import {
  stockApi,
  type StockItemRecord,
  type StockMovementPage,
} from "@/lib/stock";
import { suppliersApi, type SupplierRecord } from "@/lib/suppliers";

const pageSize = 20;

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function Receipts() {
  const { user } = useAuth();
  const canReceive = Boolean(
    user?.roles.some((role) =>
      ["ADMIN", "STOCK_MANAGER", "PRODUCTION_MANAGER", "OPERATOR"].includes(
        role,
      ),
    ),
  );
  const canManagePurchaseReceipts = Boolean(
    user?.roles.some((role) => role === "ADMIN" || role === "STOCK_MANAGER"),
  );
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [stockItems, setStockItems] = useState<StockItemRecord[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderRecord[]>(
    [],
  );
  const [purchaseReceipts, setPurchaseReceipts] = useState<
    PurchaseReceiptRecord[]
  >([]);
  const [result, setResult] = useState<StockMovementPage | null>(null);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [supplierId, setSupplierId] = useState("");
  const [itemId, setItemId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [receiptOrderId, setReceiptOrderId] = useState("");
  const [savingPurchaseReceipt, setSavingPurchaseReceipt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setSearch(query.trim());
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const session = readAuthSession();
      if (!session) {
        throw new ApiError("Votre session a expiré. Reconnectez-vous.", 401);
      }
      const token = session.tokens.accessToken;
      const [supplierRows, itemRows, movementPage, orderRows, receiptRows] =
        await Promise.all([
          suppliersApi.list(token),
          stockApi.list(token),
          stockApi.listMovements(token, {
            page,
            pageSize,
            kind: "ENTRY",
            ...(search ? { search } : {}),
          }),
          canManagePurchaseReceipts
            ? purchasesApi.list(token)
            : Promise.resolve([] as PurchaseOrderRecord[]),
          canManagePurchaseReceipts
            ? purchasesApi.listReceipts(token)
            : Promise.resolve([] as PurchaseReceiptRecord[]),
        ]);
      setSuppliers(supplierRows);
      setStockItems(itemRows);
      setResult(movementPage);
      setPurchaseOrders(orderRows);
      setPurchaseReceipts(receiptRows);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Les réceptions n’ont pas pu être chargées.",
      );
    } finally {
      setLoading(false);
    }
  }, [canManagePurchaseReceipts, page, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const submitReceipt = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const quantity = Number(values.get("quantity") ?? 0);
    const supplier = suppliers.find((item) => item.id === supplierId);
    const stockItem = stockItems.find((item) => item.id === itemId);
    if (
      !supplier ||
      !stockItem ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      quantity > 2_147_483_647
    ) {
      setActionError(
        "Choisissez un fournisseur, un article et une quantité valide.",
      );
      return;
    }

    setSaving(true);
    setActionError(null);
    try {
      const session = readAuthSession();
      if (!session) {
        throw new ApiError("Votre session a expiré. Reconnectez-vous.", 401);
      }
      const notes = String(values.get("notes") ?? "").trim();
      await stockApi.createMovement(session.tokens.accessToken, {
        itemId: stockItem.id,
        kind: "ENTRY",
        quantity,
        source: supplier.name,
        notes: notes || null,
      });
      setNotice(
        `${quantity} ${stockItem.unit} de ${stockItem.name} ajoutés au stock depuis ${supplier.name}.`,
      );
      setIsModalOpen(false);
      setPage(1);
      if (page === 1) void load();
    } catch (reason) {
      setActionError(
        reason instanceof Error
          ? reason.message
          : "La réception n’a pas pu être enregistrée.",
      );
    } finally {
      setSaving(false);
    }
  };

  const pendingPurchaseOrders = purchaseOrders.filter(
    (order) => order.status !== "RECEIVED",
  );
  const selectedPurchaseOrder = purchaseOrders.find(
    (order) => order.id === receiptOrderId,
  );

  const openPurchaseReceipt = () => {
    setReceiptOrderId(pendingPurchaseOrders[0]?.id ?? "");
    setActionError(null);
    setIsPurchaseModalOpen(true);
  };

  const submitPurchaseReceipt = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const order = selectedPurchaseOrder;
    const values = new FormData(event.currentTarget);
    const lines = (order?.lines ?? [])
      .map((line) => ({
        purchaseOrderLineId: line.id,
        quantity: Number(values.get(`quantity-${line.id}`) ?? 0),
      }))
      .filter((line) => line.quantity > 0);

    if (
      !order ||
      !lines.length ||
      lines.some((line) => {
        const orderLine = order.lines.find(
          (candidate) => candidate.id === line.purchaseOrderLineId,
        );
        return (
          !Number.isInteger(line.quantity) ||
          line.quantity <= 0 ||
          line.quantity > 2_147_483_647 ||
          !orderLine ||
          line.quantity > orderLine.quantityRemaining
        );
      })
    ) {
      setActionError(
        "Choisissez une commande et vérifiez les quantités reçues pour chaque article.",
      );
      return;
    }

    setSavingPurchaseReceipt(true);
    setActionError(null);
    try {
      const session = readAuthSession();
      if (!session) {
        throw new ApiError("Votre session a expiré. Reconnectez-vous.", 401);
      }
      const deliveryReference = String(
        values.get("deliveryReference") ?? "",
      ).trim();
      const notes = String(values.get("purchaseReceiptNotes") ?? "").trim();
      const receipt = await purchasesApi.receive(
        session.tokens.accessToken,
        order.id,
        {
          deliveryReference: deliveryReference || null,
          notes: notes || null,
          lines,
        },
      );
      setNotice(
        `${receipt.receiptNumber} enregistré pour ${receipt.purchaseNumber} (${receipt.supplierName}).`,
      );
      setIsPurchaseModalOpen(false);
      setPage(1);
      if (page === 1) void load();
    } catch (reason) {
      setActionError(
        reason instanceof Error
          ? reason.message
          : "La réception de la commande n’a pas pu être enregistrée.",
      );
    } finally {
      setSavingPurchaseReceipt(false);
    }
  };

  const totalPages = result ? Math.ceil(result.total / pageSize) : 0;

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        eyebrow="Achats · Stock"
        title="Réceptions fournisseurs"
        description="Enregistrez les quantités reçues comme entrées de stock et consultez leur historique par fournisseur, article et bon de livraison."
        action={
          <>
            {canManagePurchaseReceipts && (
              <PrimaryButton
                icon={PackagePlus}
                disabled={loading || pendingPurchaseOrders.length === 0}
                onClick={openPurchaseReceipt}
              >
                Réceptionner une commande
              </PrimaryButton>
            )}
            {canReceive && (
              <SecondaryButton
                icon={PackagePlus}
                disabled={loading || !suppliers.length || !stockItems.length}
                onClick={() => {
                  setSupplierId(suppliers[0]?.id ?? "");
                  setItemId(stockItems[0]?.id ?? "");
                  setActionError(null);
                  setIsModalOpen(true);
                }}
              >
                Entrée hors commande
              </SecondaryButton>
            )}
          </>
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
      {!loading && canReceive && (!suppliers.length || !stockItems.length) && (
        <p className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
          Ajoutez au moins un fournisseur et un article de stock avant
          d’enregistrer une réception.
        </p>
      )}
      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Lignes reçues"
          value={loading ? "…" : String(result?.total ?? 0)}
          icon={PackagePlus}
          tone="blue"
          detail="Entrées enregistrées dans Stock"
        />
        <MetricCard
          label="Fournisseurs actifs"
          value={loading ? "…" : String(suppliers.length)}
          icon={PackagePlus}
          tone="violet"
        />
        <MetricCard
          label="Articles de stock"
          value={loading ? "…" : String(stockItems.length)}
          icon={PackagePlus}
          tone="green"
        />
      </section>
      {canManagePurchaseReceipts && (
        <section className="surface-card overflow-hidden">
          <div className="border-b border-slate-100 p-4 dark:border-slate-800">
            <h2 className="font-extrabold">Bons de réception</h2>
            <p className="mt-1 text-xs text-slate-500">
              Réceptions rattachées aux commandes fournisseurs. Les quantités
              mettent à jour le stock et le restant à livrer.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 dark:border-slate-800">
                  <th className="px-5 py-3">Date / réception</th>
                  <th className="px-3 py-3">Commande</th>
                  <th className="px-3 py-3">Fournisseur</th>
                  <th className="px-3 py-3">Articles reçus</th>
                  <th className="px-3 py-3">Bon fournisseur</th>
                  <th className="px-5 py-3">Enregistré par</th>
                </tr>
              </thead>
              <tbody>
                {purchaseReceipts.map((receipt) => (
                  <tr
                    key={receipt.id}
                    className="border-b border-slate-50 text-sm dark:border-slate-800"
                  >
                    <td className="px-5 py-3.5">
                      <b>{formatDate(receipt.receivedAt)}</b>
                      <span className="block text-xs text-slate-500">
                        {receipt.receiptNumber}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 font-bold">
                      {receipt.purchaseNumber}
                    </td>
                    <td className="px-3 py-3.5">{receipt.supplierName}</td>
                    <td className="px-3 py-3.5 text-xs">
                      {receipt.lines
                        .map(
                          (line) =>
                            `${line.itemName} : ${line.quantity} ${line.unit}`,
                        )
                        .join(" · ")}
                    </td>
                    <td className="px-3 py-3.5 text-xs text-slate-500">
                      {receipt.deliveryReference || receipt.notes || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-xs">{receipt.actorName}</td>
                  </tr>
                ))}
                {!loading && purchaseReceipts.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-sm text-slate-500"
                    >
                      Aucune réception rattachée à une commande fournisseur.
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-sm text-slate-500"
                    >
                      Chargement des bons de réception…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <section className="surface-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Fournisseur, article, bon de livraison ou auteur…"
          />
          <p className="text-xs font-semibold text-slate-500">
            {loading
              ? "Chargement…"
              : `${result?.total ?? 0} ligne(s) reçue(s)`}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 dark:border-slate-800">
                <th className="px-5 py-3">Date</th>
                <th className="px-3 py-3">Fournisseur</th>
                <th className="px-3 py-3">Article reçu</th>
                <th className="px-3 py-3">Quantité</th>
                <th className="px-3 py-3">Bon / note</th>
                <th className="px-5 py-3">Enregistré par</th>
              </tr>
            </thead>
            <tbody>
              {result?.items.map((movement) => (
                <tr
                  key={movement.id}
                  className="border-b border-slate-50 text-sm dark:border-slate-800"
                >
                  <td className="px-5 py-3.5 text-xs text-slate-500">
                    {formatDate(movement.createdAt)}
                  </td>
                  <td className="px-3 py-3.5 font-semibold">
                    {movement.source || "Origine non renseignée"}
                  </td>
                  <td className="px-3 py-3.5">
                    <b>{movement.itemName}</b>
                    <span className="block text-xs text-slate-500">
                      {movement.itemReference}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 font-extrabold text-emerald-700">
                    +{movement.delta}
                  </td>
                  <td className="px-3 py-3.5 text-xs text-slate-500">
                    {movement.notes || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-xs">{movement.actorName}</td>
                </tr>
              ))}
              {!loading && !result?.items.length && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-sm text-slate-500"
                  >
                    Aucune entrée de stock ne correspond à la recherche.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-sm text-slate-500"
                  >
                    Chargement des réceptions…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 p-4 dark:border-slate-800">
          <p className="text-xs text-slate-500">
            Page {totalPages ? `${page} / ${totalPages}` : "—"}
          </p>
          <div className="flex gap-2">
            <SecondaryButton
              disabled={loading || page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Précédent
            </SecondaryButton>
            <SecondaryButton
              disabled={loading || !totalPages || page >= totalPages}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
            >
              Suivant
            </SecondaryButton>
          </div>
        </div>
      </section>
      <Modal
        open={isPurchaseModalOpen}
        onClose={() => {
          if (!savingPurchaseReceipt) setIsPurchaseModalOpen(false);
        }}
        title="Réceptionner une commande fournisseur"
        description="Saisissez les quantités livrées. Le stock, le restant à livrer et le bon de réception seront enregistrés ensemble."
        icon={PackagePlus}
        size="lg"
      >
        <form onSubmit={submitPurchaseReceipt} className="space-y-5">
          {actionError && (
            <p
              role="alert"
              className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700"
            >
              {actionError}
            </p>
          )}
          <label className="field-label">
            Commande fournisseur
            <select
              required
              value={receiptOrderId}
              onChange={(event) => setReceiptOrderId(event.target.value)}
              className="field-input"
              disabled={savingPurchaseReceipt}
            >
              <option value="">Choisir une commande à recevoir</option>
              {pendingPurchaseOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.purchaseNumber} · {order.supplierName} ·{" "}
                  {order.status === "PARTIALLY_RECEIVED"
                    ? "réception partielle"
                    : "à recevoir"}
                </option>
              ))}
            </select>
          </label>
          {selectedPurchaseOrder && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 dark:bg-slate-800">
                  <tr>
                    <th className="px-3 py-2">Article</th>
                    <th className="px-3 py-2">Déjà reçu</th>
                    <th className="px-3 py-2">Restant</th>
                    <th className="px-3 py-2">Quantité reçue</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPurchaseOrder.lines.map((line) => (
                    <tr
                      key={line.id}
                      className="border-t border-slate-100 dark:border-slate-700"
                    >
                      <td className="px-3 py-3">
                        <b>{line.itemName}</b>
                        <span className="block text-xs text-slate-500">
                          {line.itemReference}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {line.quantityReceived} / {line.quantityOrdered}{" "}
                        {line.unit}
                      </td>
                      <td className="px-3 py-3">
                        {line.quantityRemaining} {line.unit}
                      </td>
                      <td className="px-3 py-3">
                        <input
                          name={`quantity-${line.id}`}
                          type="number"
                          min="0"
                          max={Math.min(line.quantityRemaining, 2_147_483_647)}
                          step="1"
                          defaultValue="0"
                          className="field-input min-w-28"
                          disabled={
                            savingPurchaseReceipt ||
                            line.quantityRemaining === 0
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field-label">
              Référence du bon de livraison
              <input
                name="deliveryReference"
                type="text"
                maxLength={120}
                placeholder="Ex. BL-2026-018"
                className="field-input"
                disabled={savingPurchaseReceipt}
              />
            </label>
            <label className="field-label">
              Note
              <input
                name="purchaseReceiptNotes"
                type="text"
                maxLength={2000}
                className="field-input"
                disabled={savingPurchaseReceipt}
              />
            </label>
          </div>
          <ModalFooter>
            <SecondaryButton
              disabled={savingPurchaseReceipt}
              onClick={() => setIsPurchaseModalOpen(false)}
            >
              Annuler
            </SecondaryButton>
            <PrimaryButton
              type="submit"
              icon={PackagePlus}
              disabled={savingPurchaseReceipt || !receiptOrderId}
            >
              {savingPurchaseReceipt
                ? "Enregistrement…"
                : "Confirmer la réception"}
            </PrimaryButton>
          </ModalFooter>
        </form>
      </Modal>
      <Modal
        open={isModalOpen}
        onClose={() => {
          if (!saving) setIsModalOpen(false);
        }}
        title="Entrée de stock hors commande"
        description="Pour une livraison liée à un achat, utilisez le formulaire Réceptionner une commande."
        icon={PackagePlus}
      >
        <form onSubmit={submitReceipt} className="space-y-5">
          {actionError && (
            <p
              role="alert"
              className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700"
            >
              {actionError}
            </p>
          )}
          <label className="field-label">
            Fournisseur
            <select
              required
              value={supplierId}
              onChange={(event) => setSupplierId(event.target.value)}
              className="field-input"
              disabled={saving}
            >
              <option value="">Choisir un fournisseur</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name} · {supplier.category}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Article de stock
            <select
              required
              value={itemId}
              onChange={(event) => setItemId(event.target.value)}
              className="field-input"
              disabled={saving}
            >
              <option value="">Choisir un article</option>
              {stockItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.reference} · {item.quantity} {item.unit}{" "}
                  en stock
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Quantité reçue
            <input
              required
              name="quantity"
              type="number"
              min="1"
              max="2147483647"
              step="1"
              defaultValue="1"
              className="field-input"
              disabled={saving}
            />
          </label>
          <label className="field-label">
            Bon de livraison ou note
            <input
              name="notes"
              type="text"
              maxLength={2000}
              placeholder="Ex. BL-2026-018"
              className="field-input"
              disabled={saving}
            />
          </label>
          <ModalFooter>
            <SecondaryButton
              disabled={saving}
              onClick={() => setIsModalOpen(false)}
            >
              Annuler
            </SecondaryButton>
            <PrimaryButton
              type="submit"
              icon={PackagePlus}
              disabled={saving || !supplierId || !itemId}
            >
              {saving ? "Enregistrement…" : "Confirmer la réception"}
            </PrimaryButton>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
