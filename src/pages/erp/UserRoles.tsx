import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useState,
} from "react";
import { Plus, ShieldCheck, UserCog, UserPlus, UsersRound } from "lucide-react";
import { Modal, ModalFooter } from "@/components/erp/Modal";
import { PrimaryButton, SecondaryButton } from "@/components/erp/Ui";
import { useAuth } from "@/hooks/useAuth";
import {
  ApiError,
  readAuthSession,
  type CreateMemberInput,
  type ManagedUser,
  type UserRole,
  USER_ROLES,
  userRoleLabels,
  usersApi,
} from "@/lib/auth";

const roleOptions = USER_ROLES.map((role) => ({
  value: role,
  label: userRoleLabels[role],
}));

function CreateMemberModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (member: ManagedUser) => void;
}) {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (isCreating) return;
    setError(null);
    setRoles([]);
    onClose();
  };

  const toggleRole = (role: UserRole) => {
    setRoles((current) =>
      current.includes(role)
        ? current.filter((item) => item !== role)
        : [...current, role],
    );
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isCreating) return;

    const session = readAuthSession();
    if (!session) {
      setError("Votre session a expiré. Reconnectez-vous, puis réessayez.");
      return;
    }
    if (roles.length === 0) {
      setError("Sélectionnez au moins un rôle pour ce membre.");
      return;
    }

    const values = new FormData(event.currentTarget);
    const temporaryPassword = String(values.get("temporaryPassword") ?? "");
    const confirmation = String(values.get("confirmation") ?? "");
    if (temporaryPassword !== confirmation) {
      setError("La confirmation du mot de passe ne correspond pas.");
      return;
    }

    const input: CreateMemberInput = {
      firstName: String(values.get("firstName") ?? "").trim(),
      lastName: String(values.get("lastName") ?? "").trim(),
      email: String(values.get("email") ?? "").trim().toLowerCase(),
      temporaryPassword,
      roles,
    };

    try {
      setIsCreating(true);
      setError(null);
      const member = await usersApi.create(session.tokens.accessToken, input);
      onCreated(member);
      setRoles([]);
      onClose();
    } catch (reason) {
      setError(
        reason instanceof ApiError || reason instanceof Error
          ? reason.message
          : "La création du membre a échoué.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Ajouter un membre"
      description="Créez un compte dans votre atelier et choisissez les accès nécessaires."
      icon={UserPlus}
      size="lg"
    >
      <form onSubmit={submit} className="space-y-4">
        {error ? (
          <p
            role="alert"
            className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-200"
          >
            {error}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field-label">
            Prénom
            <input
              required
              autoFocus
              name="firstName"
              minLength={2}
              maxLength={80}
              autoComplete="given-name"
              className="field-input"
              placeholder="Ex. Lova"
            />
          </label>
          <label className="field-label">
            Nom
            <input
              required
              name="lastName"
              minLength={2}
              maxLength={80}
              autoComplete="family-name"
              className="field-input"
              placeholder="Ex. Rakoto"
            />
          </label>
          <label className="field-label sm:col-span-2">
            Adresse e-mail
            <input
              required
              name="email"
              type="email"
              minLength={5}
              maxLength={190}
              autoComplete="email"
              className="field-input"
              placeholder="nom@exemple.mg"
            />
          </label>
          <label className="field-label">
            Mot de passe temporaire
            <input
              required
              name="temporaryPassword"
              type="password"
              minLength={8}
              pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}"
              title="Au moins 8 caractères, une minuscule, une majuscule et un chiffre."
              autoComplete="new-password"
              className="field-input"
            />
          </label>
          <label className="field-label">
            Confirmer le mot de passe
            <input
              required
              name="confirmation"
              type="password"
              minLength={8}
              autoComplete="new-password"
              className="field-input"
            />
          </label>
        </div>

        <fieldset aria-describedby="member-roles-help">
          <legend className="field-label">Rôles attribués</legend>
          <p
            id="member-roles-help"
            className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400"
          >
            Cochez un ou plusieurs rôles. Accordez uniquement les accès nécessaires.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {roleOptions.map(({ value, label }) => (
              <label
                key={value}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <input
                  type="checkbox"
                  checked={roles.includes(value)}
                  onChange={() => toggleRole(value)}
                  className="h-4 w-4 rounded border-slate-300 accent-[#ff226d] focus:ring-rose-300"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <p className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
          Le mot de passe temporaire doit contenir au moins 8 caractères, une
          minuscule, une majuscule et un chiffre. Transmettez-le au membre par
          un canal sûr.
        </p>

        <ModalFooter>
          <SecondaryButton disabled={isCreating} onClick={close}>
            Annuler
          </SecondaryButton>
          <PrimaryButton disabled={isCreating} type="submit">
            {isCreating ? "Création…" : "Créer le membre"}
          </PrimaryButton>
        </ModalFooter>
      </form>
    </Modal>
  );
}

function displayName(member: ManagedUser): string {
  return `${member.firstName} ${member.lastName}`.trim();
}

export default function UserRoles() {
  const { user } = useAuth();
  const [members, setMembers] = useState<ManagedUser[]>([]);
  const [selectedMember, setSelectedMember] = useState<ManagedUser | null>(
    null,
  );
  const [draftRoles, setDraftRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadMembers = async () => {
      const session = readAuthSession();
      if (!session) return;

      try {
        setError(null);
        setIsLoading(true);
        setMembers(await usersApi.list(session.tokens.accessToken));
      } catch (reason) {
        setError(
          reason instanceof ApiError || reason instanceof Error
            ? reason.message
            : "Impossible de charger les membres de l’atelier.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadMembers();
  }, []);

  if (!user?.roles.includes("ADMIN")) {
    return (
      <section className="surface-card mx-auto max-w-2xl p-8 text-center">
        <ShieldCheck className="mx-auto h-9 w-9 text-rose-500" />
        <h1 className="mt-4 text-xl font-extrabold">
          Accès réservé aux administrateurs
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Seuls les administrateurs peuvent consulter et modifier les rôles des
          membres.
        </p>
      </section>
    );
  }

  const selectMember = (member: ManagedUser) => {
    setSelectedMember(member);
    setDraftRoles(member.roles);
    setError(null);
    setSuccess(null);
  };

  const updateDraftRoles = (event: ChangeEvent<HTMLSelectElement>) => {
    setDraftRoles(
      Array.from(event.target.selectedOptions, (option) => option.value),
    );
  };

  const saveRoles = async () => {
    const session = readAuthSession();
    if (!session || !selectedMember) return;

    if (draftRoles.length === 0) {
      setError("Sélectionnez au moins un rôle.");
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setIsSaving(true);
      const updatedMember = await usersApi.updateRoles(
        session.tokens.accessToken,
        selectedMember.id,
        draftRoles,
      );
      setMembers((current) =>
        current.map((member) =>
          member.id === updatedMember.id ? updatedMember : member,
        ),
      );
      setSelectedMember(updatedMember);
      setDraftRoles(updatedMember.roles);
      setSuccess(
        `Les rôles de ${displayName(updatedMember)} ont été mis à jour.`,
      );
    } catch (reason) {
      setError(
        reason instanceof ApiError || reason instanceof Error
          ? reason.message
          : "La modification des rôles a échoué.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleMemberCreated = (member: ManagedUser) => {
    setMembers((current) => [
      member,
      ...current.filter((item) => item.id !== member.id),
    ]);
    setSuccess(displayName(member) + " a été ajouté à l’atelier.");
    setError(null);
  };

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="surface-card overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-6 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-[#ff226d]">
                <UsersRound className="h-5 w-5" />
                <span className="text-xs font-extrabold uppercase tracking-[0.15em]">
                  Administration
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-extrabold">Membres et rôles</h1>
              <p className="mt-1 text-sm text-slate-500">
                Gérez uniquement les droits des membres de votre atelier.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {members.length} membre{members.length > 1 ? "s" : ""}
              </span>
              <PrimaryButton
                icon={Plus}
                disabled={isLoading}
                onClick={() => {
                  setError(null);
                  setSuccess(null);
                  setIsCreateOpen(true);
                }}
              >
                Ajouter un membre
              </PrimaryButton>
            </div>
          </div>

          {error ? (
            <p
              role="alert"
              className="m-6 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
            >
              {error}
            </p>
          ) : null}
          {success ? (
            <p
              role="status"
              className="m-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
            >
              {success}
            </p>
          ) : null}

          {isLoading ? (
            <p className="p-6 text-sm font-medium text-slate-500">
              Chargement des membres…
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {members.map((member) => (
                <li
                  key={member.id}
                  className="flex flex-wrap items-center justify-between gap-4 p-5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-extrabold">
                      {displayName(member)}
                    </p>
                    <p className="mt-1 truncate text-sm text-slate-500">
                      {member.email}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {member.roles.map((role) => (
                        <span
                          key={role}
                          className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700"
                        >
                          {userRoleLabels[role] ?? role}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => selectMember(member)}
                    className="rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-extrabold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-slate-700 dark:text-slate-200"
                  >
                    Modifier
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="surface-card h-fit p-6 xl:sticky xl:top-28">
          <div className="flex items-center gap-2 text-[#ff226d]">
            <UserCog className="h-5 w-5" />
            <h2 className="font-extrabold">Modifier les rôles</h2>
          </div>

          {selectedMember ? (
            <div className="mt-5">
              <p className="font-extrabold">{displayName(selectedMember)}</p>
              <p className="mt-1 text-sm text-slate-500">
                {selectedMember.email}
              </p>

              <label
                className="mt-5 block text-sm font-bold text-slate-700 dark:text-slate-200"
                htmlFor="memberRoles"
              >
                Rôles attribués
                <select
                  id="memberRoles"
                  multiple
                  value={draftRoles}
                  onChange={updateDraftRoles}
                  className="mt-2 min-h-52 w-full rounded-xl border border-slate-200 bg-white p-2 text-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100 dark:border-slate-700 dark:bg-slate-900"
                >
                  {roleOptions.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <span className="mt-2 block text-xs font-medium text-slate-500">
                  Utilisez Ctrl (ou Cmd) pour sélectionner plusieurs rôles.
                </span>
              </label>

              <button
                type="button"
                disabled={isSaving}
                onClick={() => void saveRoles()}
                className="mt-5 flex h-11 w-full items-center justify-center rounded-xl bg-[#ff226d] px-4 text-sm font-extrabold text-white transition hover:bg-[#e91f63] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Enregistrement…" : "Enregistrer les rôles"}
              </button>
            </div>
          ) : (
            <p className="mt-5 text-sm leading-6 text-slate-500">
              Sélectionnez un membre dans la liste pour modifier ses accès.
            </p>
          )}
        </aside>
      </div>
      <CreateMemberModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleMemberCreated}
      />
    </>
  );
}
