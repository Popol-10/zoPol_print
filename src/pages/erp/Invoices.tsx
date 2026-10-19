import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { FileText, LoaderCircle, Plus, Search } from "lucide-react";
import {
  PageHeader,
  PrimaryButton,
  SecondaryButton,
} from "@/components/erp/Ui";
import { Modal, ModalFooter } from "@/components/erp/Modal";
import { StatusBadge } from "@/components/erp/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { ApiError, readAuthSession } from "@/lib/auth";
import {
  invoicesApi,
  type InvoiceEligibleOrder,
  type InvoicePaymentStatus,
  type InvoiceRecord,
} from "@/lib/invoices";
import { formatAr } from "@/utils/format";

function accessTokenOrThrow(): string {
  const session = readAuthSession();
  if (!session)
    throw new ApiError("Votre session a expiré. Reconnectez-vous.", 401);
  return session.tokens.accessToken;
}

function invoiceStatusLabel(status: InvoicePaymentStatus): string {
  return {
    ISSUED: "Émise",
    PARTIALLY_PAID: "Partiellement payée",
    PAID: "Payée",
  }[status];
}

function displayDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

export default function Invoices() {
  const { status: authStatus, user } = useAuth();
  const canAccess = Boolean(
    user?.roles.some((role) =>
      ["ADMIN", "ACCOUNTANT", "COMMERCIAL"].includes(role),
    ),
  );
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [eligibleOrders, setEligibleOrders] = useState<InvoiceEligibleOrder[]>(
    [],
  );
  const [query, setQuery] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    if (!canAccess) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const token = accessTokenOrThrow();
      const [invoiceRows, orderRows] = await Promise.all([
        invoicesApi.list(token),
        invoicesApi.eligibleOrders(token),
      ]);
      setInvoices(invoiceRows);
      setEligibleOrders(orderRows);
      setSelectedOrderId((current) =>
        orderRows.some((order) => order.id === current)
          ? current
          : (orderRows[0]?.id ?? ""),
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Les factures n’ont pas pu être chargées.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [canAccess]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return invoices.filter((invoice) =>
      `${invoice.invoiceNumber} ${invoice.orderNumber} ${invoice.clientName} ${invoice.clientCompany ?? ""} ${invoice.lines.map((line) => line.productName).join(" ")}`
        .toLowerCase()
        .includes(needle),
    );
  }, [invoices, query]);

  const selectedOrder = eligibleOrders.find(
    (order) => order.id === selectedOrderId,
  );
  const billedTotal = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const collectedTotal = invoices.reduce(
    (sum, invoice) => sum + invoice.paidAmount,
    0,
  );
  const balanceTotal = invoices.reduce(
    (sum, invoice) => sum + invoice.balanceDue,
    0,
  );

  const issueInvoice = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedOrder) return;
    setIsSaving(true);
    setError(null);
    setNotice("");
    try {
      const invoice = await invoicesApi.issueFromOrder(
        accessTokenOrThrow(),
        selectedOrder.id,
      );
      setInvoices((current) => [
        invoice,
        ...current.filter((item) => item.id !== invoice.id),
      ]);
      setEligibleOrders((current) =>
        current.filter((order) => order.id !== selectedOrder.id),
      );
      setNotice(
        `${invoice.invoiceNumber} a été émise pour ${invoice.orderNumber}.`,
      );
      setIsModalOpen(false);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "La facture n’a pas pu être émise.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (authStatus === "loading") {
    return (
      <div className="surface-card flex items-center justify-center gap-2 p-8 text-sm font-semibold text-slate-500">
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        Vérification de vos droits…
      </div>
    );
  }

  if (!canAccess) {
    return (
      <section className="surface-card p-6 text-sm text-slate-600 dark:text-slate-300">
        L’accès aux factures est réservé aux administrateurs, comptables et
        commerciaux.
      </section>
    );
  }

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        eyebrow="Commerce"
        title="Factures"
        description="Émettez une facture à partir d’une commande et suivez les paiements enregistrés dans Finance."
        action={
          <PrimaryButton
            icon={Plus}
            onClick={() => {
              setError(null);
              setIsModalOpen(true);
            }}
            disabled={eligibleOrders.length === 0}
          >
            Créer une facture
          </PrimaryButton>
        }
      />

      {error && (
        <div
          role="alert"
          className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
        >
          {error}
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
        >
          {notice}
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          ["Facturé", formatAr(billedTotal)],
          ["Encaissé", formatAr(collectedTotal)],
          ["Solde à recevoir", formatAr(balanceTotal)],
        ].map(([label, value]) => (
          <article key={label} className="surface-card p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {label}
            </p>
            <p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
              {value}
            </p>
          </article>
        ))}
      </section>

      <section className="surface-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex min-h-11 w-full max-w-md items-center gap-2 rounded-xl border border-slate-200 px-3 text-slate-400 dark:border-slate-700">
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="sr-only">Rechercher une facture</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="N° facture, commande, client, produit…"
              className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
            />
          </label>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {invoices.length} facture{invoices.length === 1 ? "" : "s"} ·{" "}
            {eligibleOrders.length} commande
            {eligibleOrders.length === 1 ? "" : "s"} à facturer
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 dark:border-slate-800">
                <th className="px-5 py-3">Facture / commande</th>
                <th className="px-3 py-3">Client</th>
                <th className="px-3 py-3">Détail</th>
                <th className="px-3 py-3">Émise le</th>
                <th className="px-3 py-3 text-right">Total</th>
                <th className="px-3 py-3 text-right">Encaissé</th>
                <th className="px-3 py-3 text-right">Solde</th>
                <th className="px-5 py-3">Paiement</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-b border-slate-50 text-sm last:border-0 dark:border-slate-800"
                >
                  <td className="px-5 py-4">
                    <p className="font-extrabold text-slate-900 dark:text-white">
                      {invoice.invoiceNumber}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Commande {invoice.orderNumber}
                    </p>
                  </td>
                  <td className="px-3 py-4">
                    <p className="font-bold">{invoice.clientName}</p>
                    {invoice.clientCompany && (
                      <p className="text-xs text-slate-500">
                        {invoice.clientCompany}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    {invoice.lines.map((line) => (
                      <p key={line.id} className="font-semibold">
                        {line.productName} · {line.quantity} ×{" "}
                        {formatAr(line.unitPrice)}
                      </p>
                    ))}
                  </td>
                  <td className="px-3 py-4 text-xs text-slate-500">
                    {displayDate(invoice.issuedAt)}
                  </td>
                  <td className="px-3 py-4 text-right font-extrabold">
                    {formatAr(invoice.total)}
                  </td>
                  <td className="px-3 py-4 text-right font-semibold text-emerald-700 dark:text-emerald-400">
                    {formatAr(invoice.paidAmount)}
                  </td>
                  <td className="px-3 py-4 text-right font-semibold">
                    {formatAr(invoice.balanceDue)}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge
                      status={invoiceStatusLabel(invoice.paymentStatus)}
                    />
                  </td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    {invoices.length
                      ? "Aucune facture ne correspond à la recherche."
                      : "Aucune facture émise pour le moment."}
                  </td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    <span className="inline-flex items-center gap-2">
                      <LoaderCircle className="h-4 w-4 animate-spin" />{" "}
                      Chargement des factures…
                    </span>
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
        title="Émettre une facture"
        description="La facture reprend les données enregistrées de la commande sélectionnée."
        icon={FileText}
      >
        <form onSubmit={issueInvoice}>
          <label
            className="block text-sm font-bold text-slate-700 dark:text-slate-200"
            htmlFor="invoice-order"
          >
            Commande à facturer
          </label>
          <select
            id="invoice-order"
            value={selectedOrderId}
            onChange={(event) => setSelectedOrderId(event.target.value)}
            required
            className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
          >
            {eligibleOrders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.orderNumber} · {order.clientName} ·{" "}
                {formatAr(order.total)}
              </option>
            ))}
          </select>
          {selectedOrder ? (
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800/70">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Client</span>
                <b className="text-right">{selectedOrder.clientName}</b>
              </div>
              <div className="mt-2 flex justify-between gap-4">
                <span className="text-slate-500">Article</span>
                <b className="text-right">
                  {selectedOrder.productName} × {selectedOrder.quantity}
                </b>
              </div>
              <div className="mt-2 flex justify-between gap-4">
                <span className="text-slate-500">Montant</span>
                <b className="text-right">{formatAr(selectedOrder.total)}</b>
              </div>
              {selectedOrder.paidAmount > 0 && (
                <div className="mt-2 flex justify-between gap-4">
                  <span className="text-slate-500">Déjà encaissé</span>
                  <b className="text-right text-emerald-700 dark:text-emerald-400">
                    {formatAr(selectedOrder.paidAmount)}
                  </b>
                </div>
              )}
            </div>
          ) : (
            <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800">
              Aucune commande ne peut être facturée.
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
              icon={FileText}
              disabled={!selectedOrder || isSaving}
            >
              {isSaving ? "Émission…" : "Émettre la facture"}
            </PrimaryButton>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
