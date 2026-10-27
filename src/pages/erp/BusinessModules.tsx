import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { CheckCircle2, FileText, Mail, Plus } from "lucide-react";
import { currencyUnitLabel, formatAr } from "@/utils/format";
import {
  PageHeader,
  PrimaryButton,
  SearchInput,
  SecondaryButton,
} from "@/components/erp/Ui";
import { StatusBadge } from "@/components/erp/StatusBadge";
import { Modal, ModalFooter } from "@/components/erp/Modal";
import { StockMovementModal } from "@/components/erp/StockMovementModal";
import { useAuth } from "@/hooks/useAuth";
import { ApiError, readAuthSession } from "@/lib/auth";
import { clientsApi, type ClientRecord } from "@/lib/clients";
import { productsApi, type ProductRecord } from "@/lib/products";
import { quotesApi, type QuoteRecord, type QuoteStatus } from "@/lib/quotes";
import {
  stockApi,
  type StockItemRecord,
  type StockMovementInput,
  type StockMovementKind,
  type StockMovementPage,
} from "@/lib/stock";
import {
  notificationsApi,
  type NotificationPreferences,
} from "@/lib/notifications";
import {
  organizationCurrencies,
  organizationTimeZones,
  organizationsApi,
  type OrganizationSettings,
} from "@/lib/organizations";
import { setOrganizationRuntimeSettings } from "@/lib/organization-runtime-settings";

function accessTokenOrThrow(): string {
  const session = readAuthSession();
  if (!session)
    throw new ApiError("Votre session a expiré. Reconnectez-vous.", 401);
  return session.tokens.accessToken;
}

function localDate(offsetDays = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

type QuoteStatusLabel = "Brouillon" | "Envoyé" | "Accepté" | "Refusé" | "Expiré";

const quoteStatusLabels = {
  DRAFT: "Brouillon",
  SENT: "Envoyé",
  ACCEPTED: "Accepté",
  REFUSED: "Refusé",
  EXPIRED: "Expiré",
} as const satisfies Record<QuoteStatus, QuoteStatusLabel>;

function quoteStatusLabel(status: QuoteStatus): QuoteStatusLabel {
  return quoteStatusLabels[status];
}

function displayQuoteDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value.slice(0, 10) + "T00:00:00"));
}

export function Quotes() {
  const { user } = useAuth();
  const canManage = Boolean(
    user?.roles.some((role) => role === "ADMIN" || role === "COMMERCIAL"),
  );
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "ALL">("ALL");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [workingQuoteId, setWorkingQuoteId] = useState<string | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<QuoteRecord | null>(null);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [unitPrice, setUnitPrice] = useState("");

  const load = useCallback(async () => {
    if (!canManage) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const accessToken = accessTokenOrThrow();
      const [quoteRows, clientRows, productRows] = await Promise.all([
        quotesApi.list(accessToken),
        clientsApi.list(accessToken),
        productsApi.list(accessToken),
      ]);
      setQuotes(quoteRows);
      setClients(clientRows);
      setProducts(productRows);
      setSelectedProductId((current) => current || productRows[0]?.id || "");
      setUnitPrice((current) => current || String(productRows[0]?.price ?? ""));
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Les devis n’ont pas pu être chargés.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [canManage]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return quotes.filter((quote) => {
      const matchesSearch =
        `${quote.quoteNumber} ${quote.clientName} ${quote.clientCompany ?? ""} ${quote.productName}`
          .toLowerCase()
          .includes(needle);
      return (
        matchesSearch &&
        (statusFilter === "ALL" || quote.status === statusFilter)
      );
    });
  }, [query, quotes, statusFilter]);

  const sentCount = quotes.filter((quote) => quote.status === "SENT").length;
  const decidedQuotes = quotes.filter((quote) =>
    ["ACCEPTED", "REFUSED"].includes(quote.status),
  );
  const acceptedRate = decidedQuotes.length
    ? (quotes.filter((quote) => quote.status === "ACCEPTED").length /
        decidedQuotes.length) *
      100
    : null;
  const pendingValue = quotes
    .filter((quote) => quote.status === "DRAFT" || quote.status === "SENT")
    .reduce((total, quote) => total + quote.total, 0);

  const createQuote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setIsSaving(true);
    setError(null);
    setNotice("");
    try {
      const created = await quotesApi.create(accessTokenOrThrow(), {
        clientId: String(values.get("clientId") ?? ""),
        productId: String(values.get("productId") ?? ""),
        quantity: Number(values.get("quantity")),
        unitPrice: Number(values.get("unitPrice")),
        validUntil: String(values.get("validUntil") ?? ""),
        note: String(values.get("note") ?? "").trim() || null,
      });
      setQuotes((current) => [created, ...current]);
      setNotice(`${created.quoteNumber} a été enregistré en brouillon.`);
      setIsQuoteModalOpen(false);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Le devis n’a pas pu être enregistré.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatus = async (quote: QuoteRecord, status: QuoteStatus) => {
    setWorkingQuoteId(quote.id);
    setError(null);
    setNotice("");
    try {
      const updated = await quotesApi.updateStatus(
        accessTokenOrThrow(),
        quote.id,
        status,
      );
      setQuotes((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setNotice(
        `${updated.quoteNumber} est maintenant « ${quoteStatusLabel(updated.status)} ».`,
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Le statut du devis n’a pas pu être modifié.",
      );
    } finally {
      setWorkingQuoteId(null);
    }
  };

  const sendQuote = async (quote: QuoteRecord) => {
    setWorkingQuoteId(quote.id);
    setError(null);
    setNotice("");
    try {
      const sent = await quotesApi.send(accessTokenOrThrow(), quote.id);
      setQuotes((current) =>
        current.map((item) => (item.id === sent.id ? sent : item)),
      );
      setNotice(`${sent.quoteNumber} a été envoyé par e-mail au client.`);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Le devis n’a pas pu être envoyé par e-mail.",
      );
    } finally {
      setWorkingQuoteId(null);
    }
  };

  const convertQuote = async (quote: QuoteRecord) => {
    setWorkingQuoteId(quote.id);
    setError(null);
    setNotice("");
    try {
      const converted = await quotesApi.convert(accessTokenOrThrow(), quote.id);
      setQuotes((current) =>
        current.map((item) => (item.id === converted.id ? converted : item)),
      );
      setNotice(
        `${converted.quoteNumber} a créé la commande ${converted.orderNumber}.`,
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "La conversion en commande a échoué.",
      );
    } finally {
      setWorkingQuoteId(null);
    }
  };

  if (!canManage) {
    return (
      <div className="page-enter space-y-6">
        <PageHeader
          eyebrow="Commerce"
          title="Devis"
          description="La gestion des devis est réservée aux rôles commercial et administrateur."
        />
        <div
          role="alert"
          className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-semibold text-amber-800"
        >
          Votre rôle ne permet pas de consulter les devis de cette organisation.
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        eyebrow="Commerce"
        title="Devis"
        description="Préparez des offres à partir du catalogue, envoyez-les par e-mail et convertissez les devis acceptés en commandes."
        action={
          <PrimaryButton
            icon={Plus}
            onClick={() => {
              setError(null);
              setIsQuoteModalOpen(true);
            }}
            disabled={!clients.length || !products.length}
          >
            Créer un devis
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
          className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
        >
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
      )}
      {!isLoading && (!clients.length || !products.length) && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
          Ajoutez au moins un client et un produit avant de créer un devis.
        </div>
      )}
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="surface-card p-4">
          <p className="text-xs text-slate-500">Devis envoyés</p>
          <p className="mt-1 text-xl font-extrabold text-blue-600">
            {isLoading ? "…" : sentCount}
          </p>
        </div>
        <div className="surface-card p-4">
          <p className="text-xs text-slate-500">
            Taux d’acceptation des devis décidés
          </p>
          <p className="mt-1 text-xl font-extrabold text-emerald-600">
            {acceptedRate === null ? "—" : acceptedRate.toFixed(0) + " %"}
          </p>
        </div>
        <div className="surface-card p-4">
          <p className="text-xs text-slate-500">
            Valeur en brouillon ou envoyée
          </p>
          <p className="mt-1 text-xl font-extrabold">
            {isLoading ? "…" : formatAr(pendingValue)}
          </p>
        </div>
      </section>
      <div className="surface-card overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="N° devis ou client…"
          />
          <label className="sr-only" htmlFor="quote-status-filter">
            Filtrer par statut
          </label>
          <select
            id="quote-status-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as QuoteStatus | "ALL")
            }
            className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="ALL">Tous les statuts</option>
            {(
              [
                "DRAFT",
                "SENT",
                "ACCEPTED",
                "REFUSED",
                "EXPIRED",
              ] as QuoteStatus[]
            ).map((status) => (
              <option key={status} value={status}>
                {quoteStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 dark:border-slate-800">
                <th className="px-5 py-3">Devis</th>
                <th className="px-3 py-3">Client</th>
                <th className="px-3 py-3">Produit</th>
                <th className="px-3 py-3">Montant</th>
                <th className="px-3 py-3">Validité</th>
                <th className="px-3 py-3">Statut</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((quote) => (
                <tr
                  key={quote.id}
                  className="border-b border-slate-50 text-sm dark:border-slate-800"
                >
                  <td className="px-5 py-3.5">
                    <p className="font-extrabold">{quote.quoteNumber}</p>
                    <p className="text-[11px] text-slate-400">
                      {displayQuoteDate(quote.createdAt)}
                    </p>
                  </td>
                  <td className="px-3 py-3.5 font-bold">
                    {quote.clientName}
                    {quote.clientCompany ? (
                      <span className="block text-xs font-normal text-slate-500">
                        {quote.clientCompany}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-3.5">
                    {quote.productName}
                    <span className="block text-xs text-slate-500">
                      {quote.quantity} × {formatAr(quote.unitPrice)}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 font-extrabold">
                    {formatAr(quote.total)}
                  </td>
                  <td className="px-3 py-3.5 text-xs text-slate-500">
                    {displayQuoteDate(quote.validUntil)}
                  </td>
                  <td className="px-3 py-3.5">
                    <StatusBadge status={quoteStatusLabel(quote.status)} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-2">
                      {quote.status === "DRAFT" && (
                        <button
                          type="button"
                          disabled={
                            workingQuoteId === quote.id ||
                            !clients
                              .find((client) => client.id === quote.clientId)
                              ?.email?.trim()
                          }
                          onClick={() => void sendQuote(quote)}
                          title={
                            clients.find((client) => client.id === quote.clientId)
                              ?.email?.trim()
                              ? undefined
                              : "Ajoutez une adresse e-mail à la fiche du client."
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700 disabled:opacity-50"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          {clients.find((client) => client.id === quote.clientId)
                            ?.email?.trim()
                            ? "Envoyer par e-mail"
                            : "E-mail client manquant"}
                        </button>
                      )}
                      {quote.status === "SENT" && (
                        <>
                          {quote.validUntil < localDate() ? (
                            <button
                              type="button"
                              disabled={workingQuoteId === quote.id}
                              onClick={() =>
                                void updateStatus(quote, "EXPIRED")
                              }
                              className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-700 disabled:opacity-50"
                            >
                              Marquer expiré
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={workingQuoteId === quote.id}
                              onClick={() => void convertQuote(quote)}
                              className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-[#e91f63] disabled:opacity-50"
                            >
                              Convertir
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={workingQuoteId === quote.id}
                            onClick={() => void updateStatus(quote, "REFUSED")}
                            className="rounded-lg px-2 py-1.5 text-xs font-bold text-slate-500 disabled:opacity-50"
                          >
                            Refuser
                          </button>
                        </>
                      )}
                      {quote.orderNumber && (
                        <a
                          href="/commandes"
                          className="rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600"
                        >
                          {quote.orderNumber}
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedQuote(quote)}
                        className="px-2 py-1.5 text-xs font-bold text-slate-500"
                      >
                        Détail
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-sm text-slate-500"
                  >
                    Aucun devis ne correspond à cette recherche.
                  </td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-sm text-slate-500"
                  >
                    Chargement des devis…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        title="Créer un devis"
        description="Le prix convenu est enregistré comme instantané et conservé lors de la conversion en commande."
        icon={FileText}
      >
        <form
          onSubmit={(event) => void createQuote(event)}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field-label">
              Client
              <select
                name="clientId"
                required
                className="field-input"
                defaultValue=""
              >
                <option value="" disabled>
                  Choisir un client
                </option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                    {client.company ? ` · ${client.company}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Produit
              <select
                name="productId"
                required
                className="field-input"
                value={selectedProductId}
                onChange={(event) => {
                  const id = event.target.value;
                  setSelectedProductId(id);
                  const product = products.find((item) => item.id === id);
                  setUnitPrice(product ? String(product.price) : "");
                }}
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} · {product.reference}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Quantité
              <input
                name="quantity"
                type="number"
                min="1"
                max="2147483647"
                step="1"
                defaultValue="1"
                required
                className="field-input"
              />
            </label>
            <label className="field-label">
              Prix convenu unitaire ({currencyUnitLabel()})
              <input
                name="unitPrice"
                type="number"
                min="0.01"
                max="999999999999.99"
                step="0.01"
                value={unitPrice}
                onChange={(event) => setUnitPrice(event.target.value)}
                required
                className="field-input"
              />
            </label>
            <label className="field-label">
              Valide jusqu’au
              <input
                name="validUntil"
                type="date"
                min={localDate()}
                defaultValue={localDate(7)}
                required
                className="field-input"
              />
            </label>
            <label className="field-label sm:col-span-2">
              Note pour le client
              <textarea
                name="note"
                rows={3}
                maxLength={2000}
                placeholder="Délai, conditions ou consignes…"
                className="field-input h-auto resize-none py-3"
              />
            </label>
          </div>
          <ModalFooter>
            <SecondaryButton onClick={() => setIsQuoteModalOpen(false)}>
              Annuler
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={isSaving}>
              {isSaving ? "Enregistrement…" : "Enregistrer le devis"}
            </PrimaryButton>
          </ModalFooter>
        </form>
      </Modal>

      <Modal
        open={Boolean(selectedQuote)}
        onClose={() => setSelectedQuote(null)}
        title={selectedQuote?.quoteNumber ?? "Détail du devis"}
        description={
          selectedQuote
            ? `${selectedQuote.clientName} · ${quoteStatusLabel(selectedQuote.status)}`
            : undefined
        }
        icon={FileText}
      >
        {selectedQuote && (
          <div className="space-y-4 text-sm">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Produit</dt>
                <dd className="font-bold">
                  {selectedQuote.productName} · {selectedQuote.productReference}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Quantité</dt>
                <dd className="font-bold">{selectedQuote.quantity}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Prix unitaire</dt>
                <dd className="font-bold">
                  {formatAr(selectedQuote.unitPrice)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Total</dt>
                <dd className="font-bold">{formatAr(selectedQuote.total)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Valide jusqu’au</dt>
                <dd className="font-bold">
                  {displayQuoteDate(selectedQuote.validUntil)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Machine</dt>
                <dd className="font-bold">{selectedQuote.machine}</dd>
              </div>
            </dl>
            <div>
              <p className="text-slate-500">Note</p>
              <p className="whitespace-pre-wrap">
                {selectedQuote.note || "Aucune note"}
              </p>
            </div>
            {selectedQuote.orderNumber && (
              <p className="rounded-xl bg-emerald-50 p-3 font-bold text-emerald-700">
                Commande créée : {selectedQuote.orderNumber}
              </p>
            )}
            <ModalFooter>
              <SecondaryButton onClick={() => setSelectedQuote(null)}>
                Fermer
              </SecondaryButton>
            </ModalFooter>
          </div>
        )}
      </Modal>
    </div>
  );
}

type ModuleKind = "movements" | "inventory" | "settings";

export function BusinessModule({ kind }: { kind: ModuleKind }) {
  if (kind === "movements") return <StockMovements />;
  if (kind === "inventory") return <StockInventory />;
  return <SettingsPage />;
}

function StockMovements() {
  const { user } = useAuth();
  const canMove = Boolean(
    user?.roles.some((role) =>
      ["ADMIN", "STOCK_MANAGER", "PRODUCTION_MANAGER", "OPERATOR"].includes(
        role,
      ),
    ),
  );
  const pageSize = 20;
  const [items, setItems] = useState<StockItemRecord[]>([]);
  const [result, setResult] = useState<StockMovementPage | null>(null);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<StockMovementKind | "ALL">("ALL");
  const [itemId, setItemId] = useState("ALL");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [movementModalOpen, setMovementModalOpen] = useState(false);

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
      const accessToken = accessTokenOrThrow();
      const [stockItems, movementPage] = await Promise.all([
        stockApi.list(accessToken),
        stockApi.listMovements(accessToken, {
          page,
          pageSize,
          ...(kind === "ALL" ? {} : { kind }),
          ...(itemId === "ALL" ? {} : { itemId }),
          ...(search ? { search } : {}),
        }),
      ]);
      setItems(stockItems);
      setResult(movementPage);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "L’historique des mouvements n’a pas pu être chargé.",
      );
    } finally {
      setLoading(false);
    }
  }, [itemId, kind, page, pageSize, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveMovement = async (movement: StockMovementInput) => {
    await stockApi.createMovement(accessTokenOrThrow(), movement);
    setMovementModalOpen(false);
    setNotice("Le mouvement a été enregistré dans l’historique du stock.");
    if (page !== 1) setPage(1);
    else void load();
  };

  const totalPages = result ? Math.ceil(result.total / pageSize) : 0;
  const movementLabel = (
    movementKind: StockMovementKind,
  ): "Entrée" | "Sortie" | "Ajustement" =>
    ({
      ENTRY: "Entrée",
      EXIT: "Sortie",
      ADJUSTMENT: "Ajustement",
    } as const)[movementKind];
  const formatMovementDate = (value: string) =>
    new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        eyebrow="Stock"
        title="Mouvements de stock"
        description="Consultez les entrées, sorties et ajustements enregistrés dans votre atelier."
        action={
          canMove ? (
            <PrimaryButton
              icon={Plus}
              onClick={() => {
                setNotice("");
                setMovementModalOpen(true);
              }}
              disabled={!items.length}
            >
              Nouveau mouvement
            </PrimaryButton>
          ) : undefined
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
      {!loading && items.length === 0 && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
          Créez un article de stock avant d’enregistrer un mouvement.
        </div>
      )}
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="surface-card p-4">
          <p className="text-xs text-slate-500">
            Mouvements correspondant aux filtres
          </p>
          <p className="mt-1 text-xl font-extrabold">
            {loading ? "…" : (result?.total ?? 0)}
          </p>
        </div>
        <div className="surface-card p-4">
          <p className="text-xs text-slate-500">Références actives</p>
          <p className="mt-1 text-xl font-extrabold">
            {loading ? "…" : items.length}
          </p>
        </div>
        <div className="surface-card p-4">
          <p className="text-xs text-slate-500">Page</p>
          <p className="mt-1 text-xl font-extrabold">
            {loading ? "…" : totalPages ? `${page} / ${totalPages}` : "—"}
          </p>
        </div>
      </section>
      <section className="surface-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 lg:flex-row lg:items-center">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Article, référence, origine ou auteur…"
          />
          <select
            aria-label="Filtrer par type de mouvement"
            value={kind}
            onChange={(event) => {
              setKind(event.target.value as StockMovementKind | "ALL");
              setPage(1);
            }}
            className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="ALL">Tous les types</option>
            <option value="ENTRY">Entrées</option>
            <option value="EXIT">Sorties</option>
            <option value="ADJUSTMENT">Ajustements</option>
          </select>
          <select
            aria-label="Filtrer par article"
            value={itemId}
            onChange={(event) => {
              setItemId(event.target.value);
              setPage(1);
            }}
            className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="ALL">Tous les articles</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.reference}
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 dark:border-slate-800">
                <th className="px-5 py-3">Date</th>
                <th className="px-3 py-3">Article</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Variation</th>
                <th className="px-3 py-3">Avant → Après</th>
                <th className="px-3 py-3">Origine / note</th>
                <th className="px-5 py-3">Saisi par</th>
              </tr>
            </thead>
            <tbody>
              {result?.items.map((movement) => (
                <tr
                  key={movement.id}
                  className="border-b border-slate-50 text-sm dark:border-slate-800"
                >
                  <td className="px-5 py-3.5 text-xs text-slate-500">
                    {formatMovementDate(movement.createdAt)}
                  </td>
                  <td className="px-3 py-3.5">
                    <b>{movement.itemName}</b>
                    <span className="block text-xs text-slate-500">
                      {movement.itemReference}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <StatusBadge status={movementLabel(movement.kind)} />
                  </td>
                  <td
                    className={`px-3 py-3.5 font-extrabold ${movement.delta > 0 ? "text-emerald-700" : "text-rose-700"}`}
                  >
                    {movement.delta > 0 ? "+" : "−"}
                    {Math.abs(movement.delta)}
                  </td>
                  <td className="px-3 py-3.5 text-xs">
                    {movement.beforeQuantity} → {movement.afterQuantity}
                  </td>
                  <td className="px-3 py-3.5 text-xs text-slate-500">
                    {movement.source || "—"}
                    {movement.notes ? (
                      <span className="block max-w-[240px] truncate">
                        {movement.notes}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-5 py-3.5 text-xs">{movement.actorName}</td>
                </tr>
              ))}
              {!loading && !result?.items.length && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-sm text-slate-500"
                  >
                    Aucun mouvement ne correspond à ces filtres.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-sm text-slate-500"
                  >
                    Chargement de l’historique…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 p-4 dark:border-slate-800">
          <p className="text-xs text-slate-500">
            {result?.total ?? 0} mouvement(s) au total
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
      <StockMovementModal
        open={movementModalOpen}
        onClose={() => setMovementModalOpen(false)}
        items={items}
        onSave={saveMovement}
      />
    </div>
  );
}

function StockInventory() {
  const { user } = useAuth();
  const canCount = Boolean(
    user?.roles.some((role) =>
      ["ADMIN", "STOCK_MANAGER", "PRODUCTION_MANAGER", "OPERATOR"].includes(
        role,
      ),
    ),
  );
  const [items, setItems] = useState<StockItemRecord[]>([]);
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await stockApi.list(accessTokenOrThrow());
      setItems(records);
      setCounts(
        Object.fromEntries(
          records.map((item) => [item.id, String(item.quantity)]),
        ),
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "L’inventaire n’a pas pu être chargé.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveCount = async (item: StockItemRecord) => {
    const rawQuantity = counts[item.id]?.trim();
    const quantity = Number(rawQuantity);
    if (
      !rawQuantity ||
      !Number.isInteger(quantity) ||
      quantity < 0 ||
      quantity > 4_294_967_295
    ) {
      setError("Saisissez une quantité entière valide pour ce comptage.");
      return;
    }

    setSavingId(item.id);
    setError(null);
    setNotice("");
    try {
      const movement = await stockApi.count(accessTokenOrThrow(), item.id, {
        quantity,
      });
      setItems((current) =>
        current.map((record) =>
          record.id === item.id
            ? { ...record, quantity: movement.afterQuantity }
            : record,
        ),
      );
      setCounts((current) => ({
        ...current,
        [item.id]: String(movement.afterQuantity),
      }));
      setNotice(
        movement.delta === 0
          ? `${item.name} : comptage vérifié à ${movement.afterQuantity}.`
          : `${item.name} : stock ajusté de ${movement.beforeQuantity} à ${movement.afterQuantity}.`,
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Le comptage n’a pas pu être enregistré.",
      );
    } finally {
      setSavingId(null);
    }
  };

  const visibleItems = items.filter((item) =>
    `${item.name} ${item.reference} ${item.category}`
      .toLocaleLowerCase("fr")
      .includes(search.trim().toLocaleLowerCase("fr")),
  );

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        eyebrow="Stock"
        title="Inventaire physique"
        description="Comparez les quantités comptées avec le stock théorique et enregistrez les écarts dans le journal."
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
      {!canCount && (
        <div className="rounded-xl border border-sky-100 bg-sky-50 p-3 text-sm text-sky-800">
          Vous pouvez consulter les quantités. Le comptage est réservé aux rôles
          Stock, Production et Administration.
        </div>
      )}
      <section className="surface-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Rechercher un article ou une référence…"
          />
          <p className="text-xs font-semibold text-slate-500">
            {loading ? "Chargement…" : `${visibleItems.length} article(s)`}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 dark:border-slate-800">
                <th className="px-5 py-3">Article</th>
                <th className="px-3 py-3">Stock théorique</th>
                <th className="px-3 py-3">Quantité comptée</th>
                <th className="px-3 py-3">Écart</th>
                {canCount && <th className="px-5 py-3">Action</th>}
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((item) => {
                const countValue = counts[item.id] ?? String(item.quantity);
                const count = Number(countValue);
                const delta = Number.isInteger(count)
                  ? count - item.quantity
                  : 0;
                return (
                  <tr
                    key={item.id}
                    className="border-b border-slate-50 text-sm dark:border-slate-800"
                  >
                    <td className="px-5 py-3.5">
                      <b>{item.name}</b>
                      <span className="block text-xs text-slate-500">
                        {item.reference} · {item.category}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 font-semibold">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-3 py-3.5">
                      {canCount ? (
                        <input
                          aria-label={`Quantité comptée pour ${item.name}`}
                          type="number"
                          min={0}
                          max={4_294_967_295}
                          step={1}
                          value={countValue}
                          onChange={(event) =>
                            setCounts((current) => ({
                              ...current,
                              [item.id]: event.target.value,
                            }))
                          }
                          className="min-h-10 w-32 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900"
                        />
                      ) : (
                        <span>
                          {item.quantity} {item.unit}
                        </span>
                      )}
                    </td>
                    <td
                      className={`px-3 py-3.5 font-extrabold ${delta > 0 ? "text-emerald-700" : delta < 0 ? "text-rose-700" : "text-slate-500"}`}
                    >
                      {delta > 0 ? "+" : delta < 0 ? "−" : ""}
                      {Math.abs(delta)}
                    </td>
                    {canCount && (
                      <td className="px-5 py-3.5">
                        <PrimaryButton
                          icon={CheckCircle2}
                          disabled={loading || savingId !== null}
                          onClick={() => void saveCount(item)}
                          className="min-h-9 px-3 py-2 text-xs"
                        >
                          {savingId === item.id ? "Enregistrement…" : "Valider"}
                        </PrimaryButton>
                      </td>
                    )}
                  </tr>
                );
              })}
              {!loading && visibleItems.length === 0 && (
                <tr>
                  <td
                    colSpan={canCount ? 5 : 4}
                    className="p-8 text-center text-sm text-slate-500"
                  >
                    {items.length
                      ? "Aucun article ne correspond à la recherche."
                      : "Aucun article de stock à compter."}
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td
                    colSpan={canCount ? 5 : 4}
                    className="p-8 text-center text-sm text-slate-500"
                  >
                    Chargement des articles…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SettingsPage() {
  const { user } = useAuth();
  const canManageCompany = user?.roles.includes("ADMIN") ?? false;
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    lowStockEnabled: true,
    orderDueEnabled: true,
    maintenanceEnabled: true,
  });
  const [organizationSettings, setOrganizationSettings] =
    useState<OrganizationSettings | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyCurrency, setCompanyCurrency] = useState("MGA");
  const [companyTimezone, setCompanyTimezone] = useState("Indian/Antananarivo");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [preferencesSaved, setPreferencesSaved] = useState(false);
  const [companySaved, setCompanySaved] = useState(false);

  useEffect(() => {
    let isActive = true;
    const loadSettings = async () => {
      try {
        const accessToken = accessTokenOrThrow();
        const [organizationResult, preferencesResult] =
          await Promise.allSettled([
            organizationsApi.getSettings(accessToken),
            notificationsApi.getPreferences(accessToken),
          ]);
        if (!isActive) return;

        if (organizationResult.status === "fulfilled") {
          setOrganizationSettings(organizationResult.value);
          setCompanyName(organizationResult.value.name);
          setCompanyAddress(organizationResult.value.address ?? "");
          setCompanyCurrency(organizationResult.value.currency);
          setCompanyTimezone(organizationResult.value.timezone);
        } else {
          setCompanyError(
            organizationResult.reason instanceof Error
              ? organizationResult.reason.message
              : "Les paramètres de l’entreprise n’ont pas pu être chargés.",
          );
        }

        if (preferencesResult.status === "fulfilled") {
          setPreferences(preferencesResult.value);
        } else {
          setPreferencesError(
            preferencesResult.reason instanceof Error
              ? preferencesResult.reason.message
              : "Les préférences de notification n’ont pas pu être chargées.",
          );
        }
      } catch (reason) {
        if (isActive) {
          const message =
            reason instanceof Error
              ? reason.message
              : "Les paramètres n’ont pas pu être chargés.";
          setCompanyError(message);
          setPreferencesError(message);
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    void loadSettings();
    return () => {
      isActive = false;
    };
  }, []);

  const saveCompanySettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManageCompany || isSavingCompany) return;
    setIsSavingCompany(true);
    setCompanyError(null);
    setCompanySaved(false);
    try {
      const result = await organizationsApi.updateSettings(
        accessTokenOrThrow(),
        {
          name: companyName.trim(),
          address: companyAddress.trim() || null,
          currency: companyCurrency,
          timezone: companyTimezone,
        },
      );
      setOrganizationSettings(result);
      setCompanyName(result.name);
      setCompanyAddress(result.address ?? "");
      setCompanyCurrency(result.currency);
      setCompanyTimezone(result.timezone);
      setOrganizationRuntimeSettings(result);
      window.dispatchEvent(new Event("organization-settings-updated"));
      setCompanySaved(true);
    } catch (reason) {
      setCompanyError(
        reason instanceof Error
          ? reason.message
          : "Les paramètres de l’entreprise n’ont pas pu être enregistrés.",
      );
    } finally {
      setIsSavingCompany(false);
    }
  };

  const savePreferences = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSavingPreferences) return;
    setIsSavingPreferences(true);
    setPreferencesError(null);
    setPreferencesSaved(false);
    try {
      const result = await notificationsApi.updatePreferences(
        accessTokenOrThrow(),
        preferences,
      );
      setPreferences(result);
      setPreferencesSaved(true);
      window.dispatchEvent(new Event("notifications-preferences-updated"));
    } catch (reason) {
      setPreferencesError(
        reason instanceof Error
          ? reason.message
          : "Les préférences de notification n’ont pas pu être enregistrées.",
      );
    } finally {
      setIsSavingPreferences(false);
    }
  };

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        eyebrow="Configuration"
        title="Paramètres"
        description="Informations de l’organisation et préférences de notification de votre compte."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="surface-card p-5">
          <h2 className="font-extrabold">Informations de l'entreprise</h2>
          <p className="mt-1 text-sm text-slate-500">
            Informations partagées avec les membres de votre organisation.
          </p>
          <form onSubmit={saveCompanySettings} className="mt-4 space-y-4">
            {companyError && (
              <p
                role="alert"
                className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
              >
                {companyError}
              </p>
            )}
            {companySaved && (
              <p
                role="status"
                className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"
              >
                <CheckCircle2 className="h-4 w-4" /> Paramètres de l’entreprise
                enregistrés.
              </p>
            )}
            <label className="field-label">
              Nom commercial
              <input
                required
                minLength={2}
                maxLength={120}
                disabled={isLoading || isSavingCompany || !canManageCompany}
                className="field-input"
                value={companyName}
                onChange={(event) => {
                  setCompanyName(event.target.value);
                  setCompanySaved(false);
                }}
              />
            </label>
            <label className="field-label">
              Adresse de l’atelier
              <input
                maxLength={255}
                disabled={isLoading || isSavingCompany || !canManageCompany}
                className="field-input"
                value={companyAddress}
                onChange={(event) => {
                  setCompanyAddress(event.target.value);
                  setCompanySaved(false);
                }}
                placeholder="Adresse postale"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="field-label">
                Devise
                <select
                  disabled={isLoading || isSavingCompany || !canManageCompany}
                  className="field-input"
                  value={companyCurrency}
                  onChange={(event) => {
                    setCompanyCurrency(event.target.value);
                    setCompanySaved(false);
                  }}
                >
                  {organizationCurrencies.map((currency) => (
                    <option key={currency.value} value={currency.value}>
                      {currency.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                Fuseau horaire
                <select
                  disabled={isLoading || isSavingCompany || !canManageCompany}
                  className="field-input"
                  value={companyTimezone}
                  onChange={(event) => {
                    setCompanyTimezone(event.target.value);
                    setCompanySaved(false);
                  }}
                >
                  {organizationTimeZones.map((timeZone) => (
                    <option key={timeZone.value} value={timeZone.value}>
                      {timeZone.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="text-xs leading-5 text-slate-500">
              Le changement de devise modifie l’unité affichée pour les montants
              existants ; aucune conversion de valeurs n’est effectuée.
            </p>
            {canManageCompany ? (
              <PrimaryButton
                type="submit"
                disabled={isLoading || isSavingCompany || !organizationSettings}
              >
                {isSavingCompany
                  ? "Enregistrement…"
                  : "Enregistrer l’entreprise"}
              </PrimaryButton>
            ) : (
              <p className="text-xs font-medium text-slate-500">
                Seul un administrateur peut modifier ces informations.
              </p>
            )}
          </form>
        </section>
        <section className="surface-card p-5">
          <h2 className="font-extrabold">Préférences opérationnelles</h2>
          <p className="mt-1 text-sm text-slate-500">
            Ces réglages ne s’appliquent qu’à votre compte.
          </p>
          <form onSubmit={savePreferences} className="mt-4 space-y-3">
            {preferencesError && (
              <p
                role="alert"
                className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
              >
                {preferencesError}
              </p>
            )}
            {preferencesSaved && (
              <p
                role="status"
                className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"
              >
                <CheckCircle2 className="h-4 w-4" /> Préférences de notification
                enregistrées.
              </p>
            )}
            {[
              {
                key: "lowStockEnabled" as const,
                label: "Alertes de stock",
                description:
                  "Alerter quand un article atteint le seuil ou la rupture.",
              },
              {
                key: "maintenanceEnabled" as const,
                label: "Maintenance",
                description: "Rappeler les maintenances à venir ou en retard.",
              },
              {
                key: "orderDueEnabled" as const,
                label: "Commandes urgentes",
                description:
                  "Alerter pour les commandes dues aujourd'hui, demain ou en retard.",
              },
            ].map((preference) => (
              <label
                key={preference.key}
                className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-800"
              >
                <span>
                  <b className="block text-sm">{preference.label}</b>
                  <small className="text-xs text-slate-500">
                    {preference.description}
                  </small>
                </span>
                <input
                  type="checkbox"
                  checked={preferences[preference.key]}
                  disabled={isLoading || isSavingPreferences}
                  onChange={(event) => {
                    setPreferencesSaved(false);
                    setPreferences((current) => ({
                      ...current,
                      [preference.key]: event.target.checked,
                    }));
                  }}
                  className="h-4 w-4 accent-[#ff226d]"
                />
              </label>
            ))}
            <PrimaryButton
              type="submit"
              disabled={isLoading || isSavingPreferences}
            >
              {isSavingPreferences
                ? "Enregistrement…"
                : "Enregistrer les préférences"}
            </PrimaryButton>
          </form>
        </section>
      </div>
    </div>
  );
}
