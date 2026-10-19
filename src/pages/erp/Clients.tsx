import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Eye, Plus, Trash2, X } from "lucide-react";
import { Modal, ModalFooter } from "@/components/erp/Modal";
import { OverlayDrawer } from "@/components/erp/OverlayDrawer";
import {
  PageHeader,
  PrimaryButton,
  SearchInput,
  SecondaryButton,
} from "@/components/erp/Ui";
import { useAuth } from "@/hooks/useAuth";
import { ApiError, readAuthSession } from "@/lib/auth";
import {
  clientsApi,
  type ClientInput,
  type ClientRecord,
  type ClientType,
} from "@/lib/clients";

const clientTypes: Array<{ value: ClientType; label: string }> = [
  { value: "INDIVIDUAL", label: "Particulier" },
  { value: "COMPANY", label: "Entreprise" },
  { value: "RESELLER", label: "Revendeur" },
];

function clientTypeLabel(type: ClientType): string {
  return clientTypes.find((item) => item.value === type)?.label ?? type;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getErrorMessage(reason: unknown, fallback: string): string {
  return reason instanceof ApiError || reason instanceof Error
    ? reason.message
    : fallback;
}

function ClientForm({
  onClose,
  onSave,
  client,
}: {
  onClose: () => void;
  onSave: (input: ClientInput) => Promise<void>;
  client?: ClientRecord;
}) {
  const [name, setName] = useState(client?.name ?? "");
  const [company, setCompany] = useState(client?.company ?? "");
  const [phone, setPhone] = useState(client?.phone ?? "");
  const [email, setEmail] = useState(client?.email ?? "");
  const [city, setCity] = useState(client?.city ?? "");
  const [type, setType] = useState<ClientType>(client?.type ?? "INDIVIDUAL");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (!saving) onClose();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        company: company.trim() || null,
        phone: phone.trim() || null,
        email: email.trim().toLowerCase() || null,
        city: city.trim() || null,
        type,
      });
    } catch (reason) {
      setError(getErrorMessage(reason, "L’enregistrement du client a échoué."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={close}
      title={client ? "Modifier le client" : "Nouveau client"}
      description={
        client
          ? "Mettez à jour les coordonnées du client."
          : "Ajoutez un client à votre portefeuille."
      }
      icon={Plus}
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
            Nom complet
            <input
              autoFocus
              required
              minLength={2}
              maxLength={160}
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex. Aina Rakoto"
              className="field-input"
            />
          </label>
          <label className="field-label sm:col-span-2">
            Entreprise <span className="font-normal text-slate-400">(facultatif)</span>
            <input
              maxLength={160}
              autoComplete="organization"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder="Ex. Atelier Aina"
              className="field-input"
            />
          </label>
          <label className="field-label">
            Téléphone
            <input
              maxLength={40}
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+261..."
              className="field-input"
            />
          </label>
          <label className="field-label">
            E-mail
            <input
              maxLength={190}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nom@exemple.mg"
              className="field-input"
            />
          </label>
          <label className="field-label">
            Ville
            <input
              maxLength={120}
              autoComplete="address-level2"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Ex. Antananarivo"
              className="field-input"
            />
          </label>
          <label className="field-label">
            Type de client
            <select
              value={type}
              onChange={(event) => setType(event.target.value as ClientType)}
              className="field-input"
            >
              {clientTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <ModalFooter>
          <SecondaryButton disabled={saving} onClick={close}>
            Annuler
          </SecondaryButton>
          <PrimaryButton disabled={saving} type="submit">
            {saving
              ? "Enregistrement…"
              : client
                ? "Enregistrer les modifications"
                : "Créer le client"}
          </PrimaryButton>
        </ModalFooter>
      </form>
    </Modal>
  );
}

function ClientDetail({
  client,
  canManage,
  onClose,
  onEdit,
}: {
  client: ClientRecord;
  canManage: boolean;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <OverlayDrawer
      open
      onClose={onClose}
      label={`Fiche de ${client.name}`}
      contentClassName="p-6"
    >
        <div className="flex justify-between">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la fiche client"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
          {canManage ? (
            <button
              type="button"
              onClick={onEdit}
              className="text-xs font-bold text-[#ff226d]"
            >
              Modifier
            </button>
          ) : null}
        </div>
        <div className="mt-5 flex items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-lg font-extrabold text-[#e91f63]">
            {initials(client.name)}
          </span>
          <div>
            <h2 className="text-xl font-extrabold">{client.name}</h2>
            <p className="text-sm text-slate-500">{client.company || "—"}</p>
          </div>
        </div>
        <div className="mt-6">
          <h3 className="font-extrabold">Coordonnées</h3>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-400">Téléphone</dt>
              <dd className="font-semibold">{client.phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">E-mail</dt>
              <dd className="break-all font-semibold">{client.email || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Ville</dt>
              <dd className="font-semibold">{client.city || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Type</dt>
              <dd className="font-semibold">{clientTypeLabel(client.type)}</dd>
            </div>
          </dl>
        </div>
        <p className="mt-7 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
          Les commandes et les montants associés seront affichés après le
          raccordement des modules Commandes et Finance.
        </p>
    </OverlayDrawer>
  );
}

export default function Clients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<ClientType | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selected, setSelected] = useState<ClientRecord | null>(null);
  const [editing, setEditing] = useState<ClientRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canManage = Boolean(
    user?.roles.some((role) => role === "ADMIN" || role === "COMMERCIAL"),
  );
  const canArchive = user?.roles.includes("ADMIN") ?? false;

  useEffect(() => {
    let active = true;
    const loadClients = async () => {
      const session = readAuthSession();
      if (!session) {
        setError("Votre session a expiré. Reconnectez-vous pour voir les clients.");
        setIsLoading(false);
        return;
      }
      try {
        const rows = await clientsApi.list(session.tokens.accessToken);
        if (active) setClients(rows);
      } catch (reason) {
        if (active) setError(getErrorMessage(reason, "Impossible de charger les clients."));
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void loadClients();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(
    () =>
      clients.filter((client) => {
        const matchesType = type === "ALL" || client.type === type;
        const searchable = [
          client.name,
          client.company ?? "",
          client.email ?? "",
          client.phone ?? "",
          client.city ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return matchesType && searchable.includes(query.trim().toLowerCase());
      }),
    [clients, query, type],
  );

  const openCreateForm = () => {
    setError(null);
    setSuccess(null);
    setEditing(null);
    setIsFormOpen(true);
  };

  const saveClient = async (input: ClientInput) => {
    const session = readAuthSession();
    if (!session) throw new ApiError("Votre session a expiré. Reconnectez-vous.", 401);
    setError(null);
    setSuccess(null);

    if (editing) {
      const updated = await clientsApi.update(
        session.tokens.accessToken,
        editing.id,
        input,
      );
      setClients((current) =>
        current.map((client) => (client.id === updated.id ? updated : client)),
      );
      setSelected(updated);
      setSuccess("Les coordonnées du client ont été mises à jour.");
    } else {
      const created = await clientsApi.create(session.tokens.accessToken, input);
      setClients((current) => [created, ...current]);
      setSuccess("Le client a été ajouté.");
    }

    setEditing(null);
    setIsFormOpen(false);
  };

  const archiveClient = async (client: ClientRecord) => {
    if (!window.confirm(`Archiver le client ${client.name} ?`)) return;
    const session = readAuthSession();
    if (!session) {
      setError("Votre session a expiré. Reconnectez-vous, puis réessayez.");
      return;
    }

    try {
      setDeletingId(client.id);
      setError(null);
      setSuccess(null);
      await clientsApi.archive(session.tokens.accessToken, client.id);
      setClients((current) => current.filter((item) => item.id !== client.id));
      setSelected((current) => (current?.id === client.id ? null : current));
      setSuccess("Le client a été archivé.");
    } catch (reason) {
      setError(getErrorMessage(reason, "L’archivage du client a échoué."));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        eyebrow="Commerce"
        title="Clients"
        description="Gérez les coordonnées des clients de votre atelier."
        action={
          canManage ? (
            <PrimaryButton
            icon={Plus}
            disabled={isLoading}
            onClick={openCreateForm}
          >
              Ajouter un client
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

      <div className="surface-card overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800 md:flex-row">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Nom, entreprise, e-mail, ville..."
          />
          <div className="flex gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setType("ALL")}
              className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition ${type === "ALL" ? "bg-rose-50 text-[#e91f63]" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
            >
              Tous
            </button>
            {clientTypes.map((item) => (
              <button
                type="button"
                key={item.value}
                onClick={() => setType(item.value)}
                className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition ${type === item.value ? "bg-rose-50 text-[#e91f63]" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 dark:border-slate-800">
                <th className="px-5 py-3">Client</th>
                <th className="px-3 py-3">Coordonnées</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Ville</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm text-slate-500">
                    Chargement des clients…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm text-slate-500">
                    {error
                      ? "Les clients n’ont pas pu être chargés."
                      : clients.length === 0
                        ? "Aucun client enregistré pour le moment."
                        : "Aucun client ne correspond à votre recherche."}
                  </td>
                </tr>
              ) : (
                filtered.map((client) => (
                  <tr
                    key={client.id}
                    className="border-b border-slate-50 text-sm transition hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-xs font-extrabold text-[#e91f63]">
                          {initials(client.name)}
                        </span>
                        <div>
                          <p className="font-bold">{client.name}</p>
                          <p className="text-xs text-slate-500">
                            {client.company || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-xs text-slate-500">
                      <p>{client.phone || "—"}</p>
                      <p>{client.email || "—"}</p>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {clientTypeLabel(client.type)}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-slate-500">
                      {client.city || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setSelected(client)}
                          aria-label={`Voir la fiche de ${client.name}`}
                          className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-[#ff226d] dark:hover:bg-slate-700"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {canArchive ? (
                          <button
                            type="button"
                            disabled={deletingId === client.id}
                            onClick={() => void archiveClient(client)}
                            aria-label={`Archiver ${client.name}`}
                            title="Archiver le client"
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
          {filtered.length} client{filtered.length === 1 ? "" : "s"}
          {query || type !== "ALL" ? " affiché(s)" : " enregistré(s)"}
        </div>
      </div>

      {isFormOpen ? (
        <ClientForm
          client={editing ?? undefined}
          onClose={() => {
            setIsFormOpen(false);
            setEditing(null);
          }}
          onSave={saveClient}
        />
      ) : null}
      {selected ? (
        <ClientDetail
          client={selected}
          canManage={canManage}
          onClose={() => setSelected(null)}
          onEdit={() => {
            setEditing(selected);
            setSelected(null);
            setIsFormOpen(true);
          }}
        />
      ) : null}
    </div>
  );
}
