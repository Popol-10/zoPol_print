import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, KeyRound, LogOut, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Modal, ModalFooter } from "@/components/erp/Modal";
import { PrimaryButton, SecondaryButton } from "@/components/erp/Ui";
import { useAuth } from "@/hooks/useAuth";
import { ApiError, authApi, readAuthSession } from "@/lib/auth";

export function ChangePasswordModal({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const { changePassword } = useAuth();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const currentPassword = String(form.get("currentPassword") ?? "");
    const newPassword = String(form.get("newPassword") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");
    if (newPassword !== confirmation) {
      setError("La confirmation ne correspond pas au nouveau mot de passe.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      await changePassword({ currentPassword, newPassword });
      onDone();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "La modification a échoué.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Modifier le mot de passe"
      description="Vous devrez vous reconnecter après la modification."
      icon={KeyRound}
    >
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700"
          >
            {error}
          </p>
        )}
        <label className="field-label">
          Mot de passe actuel
          <input
            required
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            className="field-input"
          />
        </label>
        <label className="field-label">
          Nouveau mot de passe
          <input
            required
            name="newPassword"
            type="password"
            minLength={8}
            autoComplete="new-password"
            className="field-input"
          />
        </label>
        <label className="field-label">
          Confirmation
          <input
            required
            name="confirmation"
            type="password"
            minLength={8}
            autoComplete="new-password"
            className="field-input"
          />
        </label>
        <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800">
          Au moins 8 caractères, avec une minuscule, une majuscule et un
          chiffre.
        </p>
        <ModalFooter>
          <SecondaryButton disabled={saving} onClick={onClose}>
            Annuler
          </SecondaryButton>
          <PrimaryButton disabled={saving} type="submit">
            {saving ? "Modification…" : "Modifier et se reconnecter"}
          </PrimaryButton>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export function AccountMenu() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const photoUrlRef = useRef<string | null>(null);
  const [open, setOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Utilisateur";
  const initials = fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const loadProfilePhoto = useCallback(async () => {
    const session = readAuthSession();
    if (!session) return;
    try {
      const image = await authApi.getProfilePhoto(session.tokens.accessToken);
      const nextUrl = URL.createObjectURL(image);
      if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
      photoUrlRef.current = nextUrl;
      setPhotoUrl(nextUrl);
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 404) {
        if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
        photoUrlRef.current = null;
        setPhotoUrl(null);
      }
    }
  }, []);

  useEffect(() => {
    void loadProfilePhoto();
    window.addEventListener("profile-photo-updated", loadProfilePhoto);
    return () => {
      window.removeEventListener("profile-photo-updated", loadProfilePhoto);
      if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    };
  }, [loadProfilePhoto]);
  const signOut = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate("/connexion", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-2.5 dark:border-slate-700 dark:bg-slate-900"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ffe1ec] text-[11px] font-extrabold text-[#e91f63]">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={`Photo de ${fullName}`}
              className="h-full w-full rounded-lg object-cover"
            />
          ) : (
            initials
          )}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-[13px] font-extrabold text-slate-800 dark:text-slate-100">
            {fullName}
          </span>
          <span className="block text-[11px] text-slate-400">
            {user?.roles.includes("ADMIN") ? "Administrateur" : "Utilisateur"}
          </span>
        </span>
        <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-30 w-64 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
            <p className="text-sm font-extrabold">{fullName}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate("/profil");
            }}
            className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#ff226d] dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <UserRound className="h-4 w-4" />
            Mon profil
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setPasswordOpen(true);
            }}
            className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#ff226d] dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <KeyRound className="h-4 w-4" />
            Modifier le mot de passe
          </button>
          <button
            type="button"
            disabled={loggingOut}
            onClick={() => void signOut()}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-60 dark:hover:bg-rose-950/30"
          >
            <LogOut className="h-4 w-4" />
            {loggingOut ? "Déconnexion…" : "Se déconnecter"}
          </button>
        </div>
      )}
      <ChangePasswordModal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        onDone={() => {
          setPasswordOpen(false);
          navigate("/connexion", {
            replace: true,
            state: { passwordChanged: true },
          });
        }}
      />
    </div>
  );
}
