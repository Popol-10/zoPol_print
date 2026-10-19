import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  Archive,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  Pencil,
  Plus,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Modal, ModalFooter } from "@/components/erp/Modal";
import { OverlayDrawer } from "@/components/erp/OverlayDrawer";
import { StatusBadge } from "@/components/erp/StatusBadge";
import { StockMovementModal } from "@/components/erp/StockMovementModal";
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
  stockApi,
  type StockItemInput,
  type StockItemRecord,
  type StockMovementInput,
  type StockMovementRecord,
} from "@/lib/stock";
import { currencyUnitLabel, formatAr } from "@/utils/format";

type MovementFormKind = "entry" | "exit" | "adjustment";

function getErrorMessage(reason: unknown, fallback: string): string {
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
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function StockItemForm({
  item,
  onClose,
  onSave,
}: {
  item?: StockItemRecord;
  onClose: () => void;
  onSave: (input: StockItemInput) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (!saving) onClose();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const values = new FormData(event.currentTarget);
    const input: StockItemInput = {
      name: String(values.get("name") ?? "").trim(),
      reference: String(values.get("reference") ?? "")
        .trim()
        .toUpperCase(),
      category: String(values.get("category") ?? "").trim(),
      minimumQuantity: Number(values.get("minimumQuantity") ?? 0),
      unit: String(values.get("unit") ?? "").trim(),
      unitCost: Number(values.get("unitCost") ?? 0),
    };
    try {
      setSaving(true);
      setError(null);
      await onSave(input);
    } catch (reason) {
      setError(
        getErrorMessage(reason, "L’enregistrement de l’article a échoué."),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={close}
      title={item ? "Modifier l’article de stock" : "Nouvel article de stock"}
      description={
        item
          ? "Modifiez les informations de suivi de cet article."
          : "Créez une référence de stock. Ajoutez ensuite la quantité disponible avec un mouvement d’entrée."
      }
      icon={Boxes}
      size="lg"
    >
      <form onSubmit={submit} className="space-y-4">
        {error ? (
          <p
            role="alert"
            className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-200"
          >
            {error}
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field-label sm:col-span-2">
            Nom de l’article
            <input
              required
              autoFocus
              minLength={2}
              maxLength={160}
              name="name"
              defaultValue={item?.name}
              className="field-input"
              placeholder="Ex. Encre blanche DTF"
            />
          </label>
          <label className="field-label">
            Référence
            <input
              required
              minLength={2}
              maxLength={64}
              pattern="[A-Za-z0-9][A-Za-z0-9._-]*"
              title="Lettres, chiffres, point, tiret et soulignement uniquement."
              name="reference"
              defaultValue={item?.reference}
              className="field-input"
              placeholder="Ex. STK-001"
            />
          </label>
          <label className="field-label">
            Catégorie
            <input
              required
              minLength={2}
              maxLength={80}
              name="category"
              defaultValue={item?.category}
              className="field-input"
              placeholder="Ex. Consommables"
            />
          </label>
          <label className="field-label">
            Unité
            <input
              required
              maxLength={32}
              name="unit"
              defaultValue={item?.unit ?? "unités"}
              className="field-input"
              placeholder="Ex. rouleaux, kg, unités"
            />
          </label>
          <label className="field-label">
            Seuil minimum
            <input
              required
              type="number"
              min="0"
              max="2147483647"
              step="1"
              name="minimumQuantity"
              defaultValue={item?.minimumQuantity ?? 0}
              className="field-input"
            />
          </label>
          <label className="field-label sm:col-span-2">
            Coût unitaire estimé ({currencyUnitLabel()})
            <input
              required
              type="number"
              min="0"
              max="999999999999.99"
              step="0.01"
              name="unitCost"
              defaultValue={item?.unitCost ?? 0}
              className="field-input"
            />
          </label>
        </div>
        <ModalFooter>
          <SecondaryButton disabled={saving} onClick={close}>
            Annuler
          </SecondaryButton>
          <PrimaryButton disabled={saving} type="submit">
            {saving
              ? "Enregistrement…"
              : item
                ? "Enregistrer les modifications"
                : "Créer l’article"}
          </PrimaryButton>
        </ModalFooter>
      </form>
    </Modal>
  );
}

function StockDetail({
  item,
  movements,
  movementsLoading,
  canMove,
  canManage,
  canArchive,
  onClose,
  onStartMovement,
  onEdit,
  onArchive,
}: {
  item: StockItemRecord;
  movements: StockMovementRecord[];
  movementsLoading: boolean;
  canMove: boolean;
  canManage: boolean;
  canArchive: boolean;
  onClose: () => void;
  onStartMovement: (kind: MovementFormKind) => void;
  onEdit: () => void;
  onArchive: () => void;
}) {
  const incoming = movements
    .filter((movement) => movement.kind === "ENTRY")
    .reduce((total, movement) => total + movement.delta, 0);
  const outgoing = movements
    .filter((movement) => movement.kind === "EXIT")
    .reduce((total, movement) => total + Math.abs(movement.delta), 0);
  const adjustments = movements.filter(
    (movement) => movement.kind === "ADJUSTMENT",
  ).length;

  return (
    <OverlayDrawer
      open
      onClose={onClose}
      label={`Détails du stock ${item.name}`}
      size="sm"
      contentClassName="p-6"
    >
      <div className="flex justify-between">
        <div className="flex gap-2">
          {canManage ? (
            <button
              type="button"
              onClick={onEdit}
              aria-label="Modifier l’article"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <Pencil className="h-5 w-5" />
            </button>
          ) : null}
          {canArchive ? (
            <button
              type="button"
              onClick={onArchive}
              aria-label="Archiver l’article"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <Archive className="h-5 w-5" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer les détails du stock"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <StatusBadge status={item.status} />
      </div>
      <p className="mt-6 text-xs font-bold uppercase tracking-wider text-[#ff226d]">
        {item.category}
      </p>
      <h2 className="mt-1 text-xl font-extrabold">{item.name}</h2>
      <p className="mt-1 text-xs text-slate-500">
        Référence {item.reference} · mis à jour {formatDate(item.updatedAt)}
      </p>
      <div className="mt-6 rounded-2xl bg-slate-900 p-5 text-white">
        <p className="text-xs text-slate-300">Stock actuel</p>
        <p className="mt-1 text-3xl font-extrabold">
          {item.quantity}{" "}
          <span className="text-base font-semibold text-slate-300">
            {item.unit}
          </span>
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
          <i
            style={{
              width: `${Math.min(100, (item.quantity / Math.max(item.minimumQuantity * 3, 1)) * 100)}%`,
            }}
            className="block h-full rounded-full bg-[#ff6b9d]"
          />
        </div>
        <p className="mt-2 text-[11px] text-slate-300">
          Seuil minimum : {item.minimumQuantity} {item.unit}
        </p>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-emerald-50 p-3">
          <p className="text-[10px] text-emerald-700">Entrées récentes</p>
          <b className="text-lg text-emerald-700">+{incoming}</b>
        </div>
        <div className="rounded-xl bg-rose-50 p-3">
          <p className="text-[10px] text-rose-700">Sorties récentes</p>
          <b className="text-lg text-rose-700">−{outgoing}</b>
        </div>
        <div className="rounded-xl bg-amber-50 p-3">
          <p className="text-[10px] text-amber-700">Ajustements</p>
          <b className="text-lg text-amber-700">{adjustments}</b>
        </div>
      </div>
      <div className="mt-6">
        <h3 className="font-extrabold">Historique récent</h3>
        {movementsLoading ? (
          <p className="mt-3 text-sm text-slate-500">
            Chargement de l’historique…
          </p>
        ) : null}
        {!movementsLoading && movements.length === 0 ? (
          <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-500 dark:bg-slate-800">
            Aucun mouvement enregistré.
          </p>
        ) : null}
        <div className="mt-3 space-y-2">
          {movements.map((movement) => {
            const color =
              movement.kind === "ENTRY"
                ? "text-emerald-600"
                : movement.kind === "EXIT"
                  ? "text-rose-600"
                  : "text-amber-600";
            const label =
              movement.kind === "ENTRY"
                ? "Entrée"
                : movement.kind === "EXIT"
                  ? "Sortie"
                  : "Ajustement";
            return (
              <div
                key={movement.id}
                className="rounded-xl border border-slate-100 p-3 text-xs dark:border-slate-800"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold">
                      {label}
                      {movement.source ? ` · ${movement.source}` : ""}
                    </p>
                    <p className="mt-0.5 text-slate-400">
                      {formatDate(movement.createdAt)} · {movement.actorName}
                    </p>
                  </div>
                  <b className={color}>
                    {movement.delta > 0 ? "+" : "−"}
                    {Math.abs(movement.delta)} {item.unit}
                  </b>
                </div>
                {movement.notes ? (
                  <p className="mt-2 text-slate-500">{movement.notes}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
      {canMove ? (
        <div className="mt-6 flex gap-2">
          <SecondaryButton
            className="flex-1"
            icon={ArrowUpFromLine}
            onClick={() => onStartMovement("exit")}
          >
            Sortie
          </SecondaryButton>
          <PrimaryButton
            className="flex-1"
            icon={ArrowDownToLine}
            onClick={() => onStartMovement("entry")}
          >
            Entrée
          </PrimaryButton>
        </div>
      ) : null}
      {canMove ? (
        <SecondaryButton
          className="mt-2 w-full"
          icon={SlidersHorizontal}
          onClick={() => onStartMovement("adjustment")}
        >
          Ajuster la quantité
        </SecondaryButton>
      ) : null}
      <p className="mt-5 text-xs text-slate-500">
        Valeur actuelle estimée : {formatAr(item.value)} · coût unitaire{" "}
        {formatAr(item.unitCost)}
      </p>
    </OverlayDrawer>
  );
}

export default function Stock() {
  const { user } = useAuth();
  const [list, setList] = useState<StockItemRecord[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Tous");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [movements, setMovements] = useState<StockMovementRecord[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [movementRequest, setMovementRequest] = useState<{
    itemId?: string;
    kind: MovementFormKind;
  } | null>(null);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [editing, setEditing] = useState<StockItemRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const canManage = Boolean(
    user?.roles.some((role) => role === "ADMIN" || role === "STOCK_MANAGER"),
  );
  const canArchive = user?.roles.includes("ADMIN") ?? false;
  const canMove = Boolean(
    user?.roles.some((role) =>
      ["ADMIN", "STOCK_MANAGER", "PRODUCTION_MANAGER", "OPERATOR"].includes(
        role,
      ),
    ),
  );
  const selected = list.find((item) => item.id === selectedId) ?? null;

  const loadItems = async () => {
    const session = readAuthSession();
    if (!session)
      throw new ApiError("Votre session a expiré. Reconnectez-vous.", 401);
    const items = await stockApi.list(session.tokens.accessToken);
    setList(items);
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      const session = readAuthSession();
      if (!session) {
        setError(
          "Votre session a expiré. Reconnectez-vous pour voir le stock.",
        );
        setIsLoading(false);
        return;
      }
      try {
        const items = await stockApi.list(session.tokens.accessToken);
        if (active) setList(items);
      } catch (reason) {
        if (active)
          setError(getErrorMessage(reason, "Impossible de charger le stock."));
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMovements([]);
      return;
    }
    let active = true;
    const load = async () => {
      const session = readAuthSession();
      if (!session) return;
      setMovementsLoading(true);
      try {
        const rows = await stockApi.movements(
          session.tokens.accessToken,
          selectedId,
        );
        if (active) setMovements(rows);
      } catch (reason) {
        if (active)
          setError(
            getErrorMessage(
              reason,
              "Impossible de charger l’historique des mouvements.",
            ),
          );
      } finally {
        if (active) setMovementsLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [selectedId, historyVersion]);

  const filtered = useMemo(
    () =>
      list.filter(
        (item) =>
          (status === "Tous" || item.status === status) &&
          `${item.name} ${item.reference} ${item.category}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    [list, query, status],
  );

  const openForm = (item?: StockItemRecord) => {
    setError(null);
    setSuccess(null);
    setEditing(item ?? null);
    setIsItemFormOpen(true);
  };

  const saveItem = async (input: StockItemInput) => {
    const session = readAuthSession();
    if (!session)
      throw new ApiError("Votre session a expiré. Reconnectez-vous.", 401);
    if (editing) {
      const updated = await stockApi.update(
        session.tokens.accessToken,
        editing.id,
        input,
      );
      setList((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setSuccess("L’article de stock a été mis à jour.");
    } else {
      const created = await stockApi.create(session.tokens.accessToken, input);
      setList((current) => [created, ...current]);
      setSuccess(
        "L’article de stock a été créé. Enregistrez une entrée pour initialiser sa quantité.",
      );
    }
    setIsItemFormOpen(false);
    setEditing(null);
  };

  const saveMovement = async (input: StockMovementInput) => {
    const session = readAuthSession();
    if (!session)
      throw new ApiError("Votre session a expiré. Reconnectez-vous.", 401);
    await stockApi.createMovement(session.tokens.accessToken, input);
    setError(null);
    setSuccess("Le mouvement de stock a été enregistré.");
    try {
      await loadItems();
    } catch (reason) {
      setError(
        getErrorMessage(
          reason,
          "Mouvement enregistré, mais le stock affiché n’a pas pu être actualisé.",
        ),
      );
    }
    setHistoryVersion((version) => version + 1);
  };

  const archiveItem = async (item: StockItemRecord) => {
    if (
      !window.confirm(
        `Archiver l’article ${item.name} ? Le stock doit être à zéro.`,
      )
    )
      return;
    const session = readAuthSession();
    if (!session) {
      setError("Votre session a expiré. Reconnectez-vous, puis réessayez.");
      return;
    }
    try {
      setError(null);
      await stockApi.archive(session.tokens.accessToken, item.id);
      setList((current) => current.filter((row) => row.id !== item.id));
      setSelectedId(null);
      setSuccess("L’article de stock a été archivé.");
    } catch (reason) {
      setError(getErrorMessage(reason, "L’archivage de l’article a échoué."));
    }
  };

  const totalValue = list.reduce((total, item) => total + item.value, 0);
  const lowStockCount = list.filter(
    (item) => item.status === "Stock faible" || item.status === "Critique",
  ).length;
  const ruptureCount = list.filter((item) => item.status === "Rupture").length;

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        eyebrow="Stock"
        title="Stocks & consommables"
        description="Anticipez les ruptures et gardez un œil sur la valeur immobilisée."
        action={
          <div className="flex flex-wrap gap-2">
            {canMove ? (
              <SecondaryButton
                icon={SlidersHorizontal}
                disabled={isLoading || list.length === 0}
                onClick={() => setMovementRequest({ kind: "adjustment" })}
              >
                Mouvement
              </SecondaryButton>
            ) : null}
            {canManage ? (
              <PrimaryButton
                icon={Plus}
                disabled={isLoading}
                onClick={() => openForm()}
              >
                Nouvel article
              </PrimaryButton>
            ) : null}
          </div>
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
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Valeur totale"
          value={formatAr(totalValue)}
          icon={Archive}
          tone="pink"
        />
        <MetricCard
          label="Articles en stock"
          value={String(list.length)}
          icon={Boxes}
          tone="blue"
          detail="références suivies"
        />
        <MetricCard
          label="Stock faible"
          value={String(lowStockCount)}
          icon={AlertTriangle}
          tone="amber"
          detail="à commander"
        />
        <MetricCard
          label="Ruptures"
          value={String(ruptureCount)}
          icon={AlertTriangle}
          tone="violet"
          detail="action immédiate"
        />
      </section>
      <div className="surface-card overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800 md:flex-row">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Produit, catégorie, référence..."
          />
          <div className="flex gap-2">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              <option>Tous</option>
              <option>En stock</option>
              <option>Stock faible</option>
              <option>Critique</option>
              <option>Rupture</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 dark:border-slate-800">
                <th className="px-5 py-3">Article</th>
                <th className="px-3 py-3">Catégorie</th>
                <th className="px-3 py-3">Stock actuel</th>
                <th className="px-3 py-3">Minimum</th>
                <th className="px-3 py-3">Statut</th>
                <th className="px-3 py-3">Valeur</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-50 text-sm hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/50"
                >
                  <td className="px-5 py-3.5">
                    <p className="font-bold">{item.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {item.reference} · mis à jour {formatDate(item.updatedAt)}
                    </p>
                  </td>
                  <td className="px-3 py-3.5 text-xs text-slate-500">
                    {item.category}
                  </td>
                  <td className="px-3 py-3.5">
                    <b
                      className={
                        item.status === "En stock" ? "" : "text-rose-600"
                      }
                    >
                      {item.quantity}
                    </b>{" "}
                    <span className="text-xs text-slate-400">{item.unit}</span>
                  </td>
                  <td className="px-3 py-3.5 text-xs text-slate-500">
                    {item.minimumQuantity} {item.unit}
                  </td>
                  <td className="px-3 py-3.5">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-3 py-3.5 font-bold">
                    {formatAr(item.value)}
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-[#ff226d] hover:bg-rose-50 dark:border-slate-700"
                    >
                      Détail
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    {list.length === 0
                      ? "Aucun article de stock. Créez une référence pour commencer."
                      : "Aucun article ne correspond à votre recherche."}
                  </td>
                </tr>
              ) : null}
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    Chargement du stock…
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
      {selected ? (
        <StockDetail
          item={selected}
          movements={movements}
          movementsLoading={movementsLoading}
          canMove={canMove}
          canManage={canManage}
          canArchive={canArchive}
          onClose={() => setSelectedId(null)}
          onStartMovement={(kind) => {
            setMovementRequest({ itemId: selected.id, kind });
            setSelectedId(null);
          }}
          onEdit={() => {
            openForm(selected);
            setSelectedId(null);
          }}
          onArchive={() => void archiveItem(selected)}
        />
      ) : null}
      {isItemFormOpen ? (
        <StockItemForm
          item={editing ?? undefined}
          onClose={() => {
            setIsItemFormOpen(false);
            setEditing(null);
          }}
          onSave={saveItem}
        />
      ) : null}
      <StockMovementModal
        open={Boolean(movementRequest)}
        onClose={() => setMovementRequest(null)}
        items={list}
        initialItemId={movementRequest?.itemId}
        initialKind={movementRequest?.kind}
        onSave={saveMovement}
      />
    </div>
  );
}
