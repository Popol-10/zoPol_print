import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Building2, Mail, MapPin, Pencil, Phone, Plus, Trash2 } from "lucide-react";
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
  suppliersApi,
  type SupplierInput,
  type SupplierRecord,
} from "@/lib/suppliers";

const suggestedCategories = [
  "Consommables",
  "Textile",
  "Supports",
  "Machines",
  "Packaging",
  "Transport",
  "Autre",
];

function errorMessage(reason: unknown, fallback: string): string {
  return reason instanceof ApiError || reason instanceof Error
    ? reason.message
    : fallback;
}

function SupplierForm({
  supplier,
  onClose,
  onSave,
}: {
  supplier?: SupplierRecord;
  onClose: () => void;
  onSave: (input: SupplierInput) => Promise<void>;
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
    const optionalValue = (name: string) =>
      String(values.get(name) ?? "").trim() || null;
    const input: SupplierInput = {
      name: String(values.get("name") ?? "").trim(),
      category: String(values.get("category") ?? "").trim(),
      contactName: optionalValue("contactName"),
      phone: optionalValue("phone"),
      email: optionalValue("email")?.toLowerCase() ?? null,
      city: optionalValue("city"),
      notes: optionalValue("notes"),
    };

    try {
      setSaving(true);
      setError(null);
      await onSave(input);
    } catch (reason) {
      setError(errorMessage(reason, "L’enregistrement du fournisseur a échoué."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={close}
      title={supplier ? "Modifier le fournisseur" : "Nouveau fournisseur"}
      description={
        supplier
          ? "Mettez à jour les coordonnées de votre fournisseur."
          : "Enregistrez les coordonnées de votre partenaire d’approvisionnement."
      }
      icon={Building2}
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
            Nom du fournisseur
            <input
              required
              autoFocus
              minLength={2}
              maxLength={160}
              name="name"
              defaultValue={supplier?.name}
              className="field-input"
              placeholder="Ex. Mada Supplies"
            />
          </label>
          <label className="field-label">
            Catégorie
            <input
              required
              minLength={2}
              maxLength={80}
              name="category"
              list="supplier-categories"
              defaultValue={supplier?.category ?? "Consommables"}
              className="field-input"
              placeholder="Ex. Supports"
            />
            <datalist id="supplier-categories">
              {suggestedCategories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </label>
          <label className="field-label">
            Personne à contacter
            <input
              maxLength={120}
              name="contactName"
              defaultValue={supplier?.contactName ?? ""}
              className="field-input"
              placeholder="Ex. Aina Rakoto"
            />
          </label>
          <label className="field-label">
            Téléphone
            <input
              maxLength={40}
              name="phone"
              type="tel"
              autoComplete="tel"
              defaultValue={supplier?.phone ?? ""}
              className="field-input"
              placeholder="+261…"
            />
          </label>
          <label className="field-label">
            E-mail
            <input
              maxLength={190}
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={supplier?.email ?? ""}
              className="field-input"
              placeholder="contact@exemple.mg"
            />
          </label>
          <label className="field-label sm:col-span-2">
            Ville
            <input
              maxLength={120}
              name="city"
              autoComplete="address-level2"
              defaultValue={supplier?.city ?? ""}
              className="field-input"
              placeholder="Ex. Antananarivo"
            />
          </label>
          <label className="field-label sm:col-span-2">
            Notes internes
            <textarea
              maxLength={1000}
              name="notes"
              rows={3}
              defaultValue={supplier?.notes ?? ""}
              className="field-input h-auto resize-y py-3"
              placeholder="Conditions, délais habituels…"
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
              : supplier
                ? "Enregistrer les modifications"
                : "Ajouter le fournisseur"}
          </PrimaryButton>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default function Suppliers() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canManage = Boolean(
    user?.roles.some(
      (role) =>
        role === "ADMIN" || role === "COMMERCIAL" || role === "STOCK_MANAGER",
    ),
  );
  const canArchive = user?.roles.includes("ADMIN") ?? false;

  useEffect(() => {
    let active = true;
    const loadSuppliers = async () => {
      const session = readAuthSession();
      if (!session) {
        setError("Votre session a expiré. Reconnectez-vous pour voir les fournisseurs.");
        setIsLoading(false);
        return;
      }
      try {
        const rows = await suppliersApi.list(session.tokens.accessToken);
        if (active) setSuppliers(rows);
      } catch (reason) {
        if (active) {
          setError(errorMessage(reason, "Impossible de charger les fournisseurs."));
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void loadSuppliers();
    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(
    () => [...new Set(suppliers.map((supplier) => supplier.category))].sort(),
    [suppliers],
  );
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return suppliers.filter((supplier) => {
      const matchesCategory = category === "ALL" || supplier.category === category;
      const searchable = [
        supplier.name,
        supplier.category,
        supplier.contactName ?? "",
        supplier.phone ?? "",
        supplier.email ?? "",
        supplier.city ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return matchesCategory && searchable.includes(normalizedQuery);
    });
  }, [suppliers, query, category]);

  const openForm = (supplier?: SupplierRecord) => {
    setError(null);
    setSuccess(null);
    setEditing(supplier ?? null);
    setIsFormOpen(true);
  };

  const saveSupplier = async (input: SupplierInput) => {
    const session = readAuthSession();
    if (!session) throw new ApiError("Votre session a expiré. Reconnectez-vous.", 401);
    setError(null);
    setSuccess(null);

    if (editing) {
      const updated = await suppliersApi.update(
        session.tokens.accessToken,
        editing.id,
        input,
      );
      setSuppliers((current) =>
        current.map((supplier) => (supplier.id === updated.id ? updated : supplier)),
      );
      setSuccess("Les coordonnées du fournisseur ont été mises à jour.");
    } else {
      const created = await suppliersApi.create(session.tokens.accessToken, input);
      setSuppliers((current) => [created, ...current]);
      setSuccess("Le fournisseur a été ajouté.");
    }

    setEditing(null);
    setIsFormOpen(false);
  };

  const archiveSupplier = async (supplier: SupplierRecord) => {
    if (!window.confirm(`Archiver le fournisseur ${supplier.name} ?`)) return;
    const session = readAuthSession();
    if (!session) {
      setError("Votre session a expiré. Reconnectez-vous, puis réessayez.");
      return;
    }

    try {
      setDeletingId(supplier.id);
      setError(null);
      setSuccess(null);
      await suppliersApi.archive(session.tokens.accessToken, supplier.id);
      setSuppliers((current) => current.filter((item) => item.id !== supplier.id));
      setSuccess("Le fournisseur a été archivé.");
    } catch (reason) {
      setError(errorMessage(reason, "L’archivage du fournisseur a échoué."));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        eyebrow="Achats"
        title="Fournisseurs"
        description="Gérez les partenaires et les coordonnées de votre atelier."
        action={
          canManage ? (
            <PrimaryButton
              icon={Plus}
              disabled={isLoading}
              onClick={() => openForm()}
            >
              Ajouter un fournisseur
            </PrimaryButton>
          ) : null
        }
      />

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
        <div className="surface-card p-4">
          <p className="text-xs text-slate-500">Fournisseurs actifs</p>
          <p className="mt-1 text-xl font-extrabold">{suppliers.length}</p>
        </div>
        <div className="surface-card p-4">
          <p className="text-xs text-slate-500">Catégories représentées</p>
          <p className="mt-1 text-xl font-extrabold">{categories.length}</p>
        </div>
        <div className="surface-card p-4">
          <p className="text-xs text-slate-500">Avec coordonnées directes</p>
          <p className="mt-1 text-xl font-extrabold">
            {suppliers.filter((supplier) => supplier.phone || supplier.email).length}
          </p>
        </div>
      </section>

      <div className="surface-card overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800 md:flex-row">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Nom, contact, téléphone, e-mail, ville…"
          />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="Filtrer par catégorie"
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="ALL">Toutes les catégories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 dark:border-slate-800">
                <th className="px-5 py-3">Fournisseur</th>
                <th className="px-3 py-3">Catégorie</th>
                <th className="px-3 py-3">Contact</th>
                <th className="px-3 py-3">Ville</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm text-slate-500">
                    Chargement des fournisseurs…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm text-slate-500">
                    {error
                      ? "Les fournisseurs n’ont pas pu être chargés."
                      : suppliers.length === 0
                        ? "Aucun fournisseur enregistré pour le moment."
                        : "Aucun fournisseur ne correspond à votre recherche."}
                  </td>
                </tr>
              ) : (
                filtered.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className="border-b border-slate-50 text-sm transition hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40">
                          <Building2 className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="font-bold">{supplier.name}</p>
                          <p className="text-xs text-slate-500">
                            {supplier.contactName || "Contact non renseigné"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {supplier.category}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span>{supplier.phone || "—"}</span>
                      </div>
                      {supplier.email ? (
                        <div className="mt-1 flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span>{supplier.email}</span>
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-3.5 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {supplier.city || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        {canManage ? (
                          <button
                            type="button"
                            onClick={() => openForm(supplier)}
                            aria-label={`Modifier ${supplier.name}`}
                            title="Modifier le fournisseur"
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-[#ff226d] dark:hover:bg-slate-700"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        ) : null}
                        {canArchive ? (
                          <button
                            type="button"
                            disabled={deletingId === supplier.id}
                            onClick={() => void archiveSupplier(supplier)}
                            aria-label={`Archiver ${supplier.name}`}
                            title="Archiver le fournisseur"
                            className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 p-4 text-xs text-slate-500 dark:border-slate-800">
          {filtered.length} fournisseur{filtered.length === 1 ? "" : "s"} affiché{filtered.length === 1 ? "" : "s"}
        </div>
      </div>

      {isFormOpen ? (
        <SupplierForm
          supplier={editing ?? undefined}
          onClose={() => {
            setIsFormOpen(false);
            setEditing(null);
          }}
          onSave={saveSupplier}
        />
      ) : null}
    </div>
  );
}
