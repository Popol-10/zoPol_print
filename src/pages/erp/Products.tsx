import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Boxes, Grid2X2, List, Pencil, Plus, Trash2 } from "lucide-react";
import { Modal, ModalFooter } from "@/components/erp/Modal";
import {
  PageHeader,
  PrimaryButton,
  SearchInput,
  SecondaryButton,
} from "@/components/erp/Ui";
import { useAuth } from "@/hooks/useAuth";
import { ApiError, readAuthSession } from "@/lib/auth";
import {
  productsApi,
  type ProductCategory,
  type ProductInput,
  type ProductRecord,
} from "@/lib/products";
import { currencyUnitLabel, formatAr } from "@/utils/format";
import { machinesApi, type MachineRecord } from "@/lib/machines";

const categories: ProductCategory[] = [
  "DTF",
  "Textile",
  "Laser",
  "Acrylique",
  "Bois",
  "Personnalisation",
  "Accessoires",
];

function getErrorMessage(reason: unknown, fallback: string): string {
  return reason instanceof ApiError || reason instanceof Error
    ? reason.message
    : fallback;
}

function ProductForm({
  product,
  onClose,
  onSave,
  machineOptions,
}: {
  product?: ProductRecord;
  onClose: () => void;
  onSave: (product: ProductInput) => Promise<void>;
  machineOptions: MachineRecord[];
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
    const price = Number(values.get("price"));
    const cost = Number(values.get("cost"));
    const stock = Number(values.get("stock") || 0);
    const input: ProductInput = {
      name: String(values.get("name") ?? "").trim(),
      reference: String(values.get("reference") ?? "")
        .trim()
        .toUpperCase(),
      category: String(values.get("category")) as ProductCategory,
      price,
      cost,
      stock,
      unit: product?.unit ?? "unité",
      machine: String(values.get("machine") ?? "").trim(),
      duration: String(values.get("duration") ?? "10 min").trim() || "10 min",
      color: product?.color ?? "#fce7f3",
    };

    try {
      setSaving(true);
      setError(null);
      await onSave(input);
    } catch (reason) {
      setError(
        getErrorMessage(reason, "L’enregistrement du produit a échoué."),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={close}
      title={product ? "Modifier le produit" : "Nouveau produit fabriqué"}
      description={
        product
          ? "Mettez à jour les caractéristiques du produit."
          : "Ajoutez un produit fini. Le stock initial sera suivi avec le module Stock."
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
            Nom du produit fini
            <input
              required
              autoFocus
              minLength={2}
              maxLength={160}
              name="name"
              defaultValue={product?.name}
              className="field-input"
              placeholder="Ex. T-shirt DTF personnalisé"
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
              defaultValue={product?.reference}
              className="field-input"
              placeholder="Ex. ART-131"
            />
          </label>
          <label className="field-label">
            Catégorie
            <select
              name="category"
              className="field-input"
              defaultValue={product?.category ?? "DTF"}
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Prix de vente ({currencyUnitLabel()})
            <input
              required
              min="0.01"
              step="0.01"
              name="price"
              type="number"
              className="field-input"
              defaultValue={product?.price}
              placeholder="35000"
            />
          </label>
          <label className="field-label">
            Coût de production ({currencyUnitLabel()})
            <input
              required
              min="0"
              step="0.01"
              name="cost"
              type="number"
              className="field-input"
              defaultValue={product?.cost}
              placeholder="18500"
            />
          </label>
          <label className="field-label">
            Machine / poste
            <select
              required
              name="machine"
              defaultValue={product?.machine ?? machineOptions[0]?.name ?? ""}
              className="field-input"
              disabled={machineOptions.length === 0}
            >
              {product?.machine &&
              !machineOptions.some(
                (machine) => machine.name === product.machine,
              ) ? (
                <option value={product.machine}>{product.machine}</option>
              ) : null}
              {machineOptions.map((machine) => (
                <option key={machine.id} value={machine.name}>
                  {machine.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Temps de production
            <input
              name="duration"
              maxLength={40}
              defaultValue={product?.duration ?? "10 min"}
              className="field-input"
              placeholder="Ex. 12 min"
            />
          </label>
          <label className="field-label sm:col-span-2">
            {product
              ? "Stock de produits finis"
              : "Stock de produits finis initial"}
            <input
              name="stock"
              type="number"
              min="0"
              max="2147483647"
              step="1"
              defaultValue={product?.stock ?? 0}
              className="field-input"
            />
          </label>
        </div>
        <ModalFooter>
          <SecondaryButton disabled={saving} onClick={onClose}>
            Annuler
          </SecondaryButton>
          <PrimaryButton
            disabled={saving || machineOptions.length === 0}
            type="submit"
          >
            {saving
              ? "Enregistrement…"
              : product
                ? "Enregistrer les modifications"
                : "Créer le produit"}
          </PrimaryButton>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default function Products() {
  const { user } = useAuth();
  const [view, setView] = useState<"table" | "grid">("table");
  const [list, setList] = useState<ProductRecord[]>([]);
  const [machineOptions, setMachineOptions] = useState<MachineRecord[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ProductCategory | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const canManage = Boolean(
    user?.roles.some(
      (role) =>
        role === "ADMIN" ||
        role === "COMMERCIAL" ||
        role === "PRODUCTION_MANAGER",
    ),
  );
  const canArchive = user?.roles.includes("ADMIN") ?? false;

  useEffect(() => {
    let active = true;
    const loadProducts = async () => {
      const session = readAuthSession();
      if (!session) {
        setError(
          "Votre session a expiré. Reconnectez-vous pour voir les produits.",
        );
        setIsLoading(false);
        return;
      }
      try {
        const [products, machines] = await Promise.all([
          productsApi.list(session.tokens.accessToken),
          machinesApi.list(session.tokens.accessToken),
        ]);
        if (active) {
          setList(products);
          setMachineOptions(machines);
        }
      } catch (reason) {
        if (active) {
          setError(
            getErrorMessage(reason, "Impossible de charger les produits."),
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void loadProducts();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(
    () =>
      list.filter(
        (product) =>
          (category === "ALL" || product.category === category) &&
          `${product.name} ${product.reference}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    [list, query, category],
  );
  const averageMargin = list.length
    ? list.reduce(
        (total, product) =>
          total + ((product.price - product.cost) / product.price) * 100,
        0,
      ) / list.length
    : 0;
  const lowStockCount = list.filter((product) => product.stock < 10).length;

  const openForm = (product?: ProductRecord) => {
    setError(null);
    setSuccess(null);
    setEditing(product ?? null);
    setIsProductFormOpen(true);
  };

  const saveProduct = async (input: ProductInput) => {
    const session = readAuthSession();
    if (!session)
      throw new ApiError("Votre session a expiré. Reconnectez-vous.", 401);
    setError(null);
    setSuccess(null);

    if (editing) {
      const updated = await productsApi.update(
        session.tokens.accessToken,
        editing.id,
        input,
      );
      setList((current) =>
        current.map((product) =>
          product.id === updated.id ? updated : product,
        ),
      );
      setSuccess("Le produit a été mis à jour.");
    } else {
      const created = await productsApi.create(
        session.tokens.accessToken,
        input,
      );
      setList((current) => [created, ...current]);
      setSuccess("Le produit a été ajouté au catalogue.");
    }

    setEditing(null);
    setIsProductFormOpen(false);
  };

  const archiveProduct = async (product: ProductRecord) => {
    if (!window.confirm(`Archiver le produit ${product.name} ?`)) return;
    const session = readAuthSession();
    if (!session) {
      setError("Votre session a expiré. Reconnectez-vous, puis réessayez.");
      return;
    }

    try {
      setDeletingId(product.id);
      setError(null);
      setSuccess(null);
      await productsApi.archive(session.tokens.accessToken, product.id);
      setList((current) => current.filter((item) => item.id !== product.id));
      setSuccess("Le produit a été archivé.");
    } catch (reason) {
      setError(getErrorMessage(reason, "L’archivage du produit a échoué."));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        eyebrow="Commerce"
        title="Catalogue produits"
        description="Prix, coûts, marges et paramètres de production au même endroit."
        action={
          canManage ? (
            <PrimaryButton
              icon={Plus}
              disabled={isLoading || machineOptions.length === 0}
              onClick={() => openForm()}
            >
              Nouveau produit
            </PrimaryButton>
          ) : null
        }
      />

      {!isLoading && machineOptions.length === 0 ? (
        <p className="rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          Enregistrez d’abord une machine dans le module Machines pour pouvoir
          créer un produit.
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-200"
        >
          {error}
        </p>
      ) : null}
      {success ? (
        <p
          role="status"
          className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          {success}
        </p>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="surface-card flex items-center gap-3 p-4">
          <span className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
            <Boxes className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-slate-500">Références actives</p>
            <p className="text-lg font-extrabold">{list.length}</p>
          </div>
        </div>
        <div className="surface-card p-4">
          <p className="text-xs text-slate-500">Marge moyenne</p>
          <p className="mt-1 text-lg font-extrabold text-emerald-600">
            {averageMargin.toFixed(1)} %
          </p>
        </div>
        <div className="surface-card p-4">
          <p className="text-xs text-slate-500">Articles en stock faible</p>
          <p className="mt-1 text-lg font-extrabold text-amber-600">
            {lowStockCount} produit{lowStockCount === 1 ? "" : "s"}
          </p>
        </div>
      </section>

      <div className="surface-card overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800 lg:flex-row">
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Rechercher un produit..."
            />
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as ProductCategory | "ALL")
              }
              aria-label="Filtrer par catégorie"
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="ALL">Toutes les catégories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              aria-label="Afficher en tableau"
              aria-pressed={view === "table"}
              onClick={() => setView("table")}
              className={`rounded-lg p-2 ${view === "table" ? "bg-white text-[#ff226d] shadow-sm dark:bg-slate-700" : "text-slate-400"}`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Afficher en grille"
              aria-pressed={view === "grid"}
              onClick={() => setView("grid")}
              className={`rounded-lg p-2 ${view === "grid" ? "bg-white text-[#ff226d] shadow-sm dark:bg-slate-700" : "text-slate-400"}`}
            >
              <Grid2X2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {view === "table" ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 dark:border-slate-800">
                  <th className="px-5 py-3">Produit</th>
                  <th className="px-3 py-3">Catégorie</th>
                  <th className="px-3 py-3">Prix</th>
                  <th className="px-3 py-3">Coût</th>
                  <th className="px-3 py-3">Marge</th>
                  <th className="px-3 py-3">Stock</th>
                  <th className="px-3 py-3">Machine</th>
                  <th className="px-5 py-3">Durée</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="p-8 text-center text-sm text-slate-500"
                    >
                      Chargement des produits…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="p-8 text-center text-sm text-slate-500"
                    >
                      {error
                        ? "Les produits n’ont pas pu être chargés."
                        : list.length === 0
                          ? "Aucun produit enregistré pour le moment."
                          : "Aucun produit ne correspond à votre recherche."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((product) => {
                    const margin =
                      ((product.price - product.cost) / product.price) * 100;
                    return (
                      <tr
                        key={product.id}
                        className="border-b border-slate-50 text-sm hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/50"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <span
                              style={{ backgroundColor: product.color }}
                              className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-extrabold text-slate-600"
                            >
                              {product.name.slice(0, 1)}
                            </span>
                            <div>
                              <p className="font-bold">{product.name}</p>
                              <p className="text-[11px] text-slate-400">
                                {product.reference}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-3 py-3 font-bold">
                          {formatAr(product.price)}
                        </td>
                        <td className="px-3 py-3 text-slate-500">
                          {formatAr(product.cost)}
                        </td>
                        <td className="px-3 py-3 font-bold text-emerald-600">
                          {margin.toFixed(1)} %
                        </td>
                        <td
                          className={`px-3 py-3 font-bold ${product.stock < 10 ? "text-rose-600" : ""}`}
                        >
                          {product.stock} {product.unit}
                        </td>
                        <td className="px-3 py-3 text-xs text-slate-500">
                          {product.machine}
                        </td>
                        <td className="px-5 py-3 text-xs font-semibold">
                          {product.duration}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-1">
                            {canManage ? (
                              <button
                                type="button"
                                onClick={() => openForm(product)}
                                aria-label={`Modifier ${product.name}`}
                                title="Modifier le produit"
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-[#ff226d] dark:hover:bg-slate-700"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            ) : null}
                            {canArchive ? (
                              <button
                                type="button"
                                disabled={deletingId === product.id}
                                onClick={() => void archiveProduct(product)}
                                aria-label={`Archiver ${product.name}`}
                                title="Archiver le produit"
                                className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {isLoading ? (
              <p className="p-4 text-sm text-slate-500">
                Chargement des produits…
              </p>
            ) : filtered.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">
                {error
                  ? "Les produits n’ont pas pu être chargés."
                  : list.length === 0
                    ? "Aucun produit enregistré pour le moment."
                    : "Aucun produit ne correspond à votre recherche."}
              </p>
            ) : (
              filtered.map((product) => {
                const margin =
                  ((product.price - product.cost) / product.price) * 100;
                return (
                  <article
                    key={product.id}
                    className="rounded-2xl border border-slate-100 p-4 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800"
                  >
                    <div className="flex justify-between">
                      <span
                        style={{ backgroundColor: product.color }}
                        className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-extrabold text-slate-600"
                      >
                        {product.name.slice(0, 1)}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500 dark:bg-slate-800">
                        {product.category}
                      </span>
                    </div>
                    <p className="mt-4 font-extrabold">{product.name}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {product.reference} · {product.machine}
                    </p>
                    <div className="mt-4 flex justify-end gap-1">
                      {canManage ? (
                        <button
                          type="button"
                          onClick={() => openForm(product)}
                          aria-label={`Modifier ${product.name}`}
                          title="Modifier le produit"
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-[#ff226d] dark:hover:bg-slate-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      ) : null}
                      {canArchive ? (
                        <button
                          type="button"
                          disabled={deletingId === product.id}
                          onClick={() => void archiveProduct(product)}
                          aria-label={`Archiver ${product.name}`}
                          title="Archiver le produit"
                          className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                    <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                      <div>
                        <p className="text-slate-400">Prix</p>
                        <b>{formatAr(product.price)}</b>
                      </div>
                      <div>
                        <p className="text-slate-400">Marge</p>
                        <b className="text-emerald-600">
                          {margin.toFixed(0)} %
                        </b>
                      </div>
                      <div>
                        <p className="text-slate-400">Stock</p>
                        <b
                          className={product.stock < 10 ? "text-rose-600" : ""}
                        >
                          {product.stock}
                        </b>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}
        <div className="border-t border-slate-100 p-4 text-xs text-slate-500 dark:border-slate-800">
          {filtered.length} produit{filtered.length === 1 ? "" : "s"} affiché
          {filtered.length === 1 ? "" : "s"}
        </div>
      </div>

      {isProductFormOpen ? (
        <ProductForm
          product={editing ?? undefined}
          onClose={() => {
            setIsProductFormOpen(false);
            setEditing(null);
          }}
          onSave={saveProduct}
          machineOptions={machineOptions}
        />
      ) : null}
    </div>
  );
}
