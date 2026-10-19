import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  CalendarDays,
  Camera,
  CheckCircle2,
  ImagePlus,
  KeyRound,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { ChangePasswordModal } from "@/components/auth/AccountMenu";
import {
  PageHeader,
  PrimaryButton,
  SecondaryButton,
} from "@/components/erp/Ui";
import { useAuth } from "@/hooks/useAuth";
import { getOrganizationTimeZone } from "@/lib/organization-runtime-settings";
import {
  authApi,
  readAuthSession,
  userRoleLabels,
  type UpdateUserProfileInput,
  type UserProfile,
  type UserRole,
} from "@/lib/auth";

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

function currentDateInOrganizationTimeZone(): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: getOrganizationTimeZone(),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(date);
}

export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { user, updateProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [about, setAbout] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoVersion, setPhotoVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPhotoSaving, setIsPhotoSaving] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [photoSaved, setPhotoSaved] = useState(false);

  useEffect(() => {
    let active = true;
    const session = readAuthSession();
    if (!session) {
      setError("Votre session a expiré. Connectez-vous à nouveau.");
      setIsLoading(false);
      return;
    }

    void authApi
      .getUserProfile(session.tokens.accessToken)
      .then((result) => {
        if (!active) return;
        setProfile(result);
        setFirstName(result.firstName);
        setLastName(result.lastName);
        setPhone(result.phone ?? "");
        setAddress(result.address ?? "");
        setBirthDate(result.birthDate ?? "");
        setAbout(result.about ?? "");
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Les informations du profil n’ont pas pu être chargées.",
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    let loadedUrl: string | null = null;
    setPhotoUrl(null);
    if (!profile?.hasProfilePhoto) return;

    const session = readAuthSession();
    if (!session) return;
    void authApi
      .getProfilePhoto(session.tokens.accessToken)
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        if (!active) {
          URL.revokeObjectURL(url);
          return;
        }
        loadedUrl = url;
        setPhotoUrl(url);
      })
      .catch((reason: unknown) => {
        if (active) {
          setPhotoError(
            reason instanceof Error
              ? reason.message
              : "La photo de profil n’a pas pu être chargée.",
          );
        }
      });

    return () => {
      active = false;
      if (loadedUrl) URL.revokeObjectURL(loadedUrl);
    };
  }, [photoVersion, profile?.hasProfilePhoto]);

  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const initials = fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const submitProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;
    setError(null);
    setSaved(false);
    const input: UpdateUserProfileInput = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim() || null,
      address: address.trim() || null,
      birthDate: birthDate || null,
      about: about.trim() || null,
    };

    try {
      setIsSaving(true);
      const result = await updateProfile(input);
      setProfile(result);
      setFirstName(result.firstName);
      setLastName(result.lastName);
      setPhone(result.phone ?? "");
      setAddress(result.address ?? "");
      setBirthDate(result.birthDate ?? "");
      setAbout(result.about ?? "");
      setSaved(true);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "La mise à jour du profil a échoué.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const uploadPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file || isPhotoSaving) return;
    if (!(["image/jpeg", "image/png"] as string[]).includes(file.type)) {
      setPhotoError("Choisissez une image JPG ou PNG.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("La photo ne peut pas dépasser 2 Mo.");
      return;
    }

    const session = readAuthSession();
    if (!session) {
      setPhotoError("Votre session a expiré. Connectez-vous à nouveau.");
      return;
    }
    try {
      setIsPhotoSaving(true);
      setPhotoError(null);
      setPhotoSaved(false);
      await authApi.uploadProfilePhoto(session.tokens.accessToken, file);
      window.dispatchEvent(new Event("profile-photo-updated"));
      setProfile((current) =>
        current ? { ...current, hasProfilePhoto: true } : current,
      );
      setPhotoVersion((version) => version + 1);
      setPhotoSaved(true);
    } catch (reason) {
      setPhotoError(
        reason instanceof Error
          ? reason.message
          : "La photo de profil n’a pas pu être enregistrée.",
      );
    } finally {
      setIsPhotoSaving(false);
    }
  };

  const removePhoto = async () => {
    const session = readAuthSession();
    if (!session || isPhotoSaving) return;
    try {
      setIsPhotoSaving(true);
      setPhotoError(null);
      setPhotoSaved(false);
      await authApi.deleteProfilePhoto(session.tokens.accessToken);
      window.dispatchEvent(new Event("profile-photo-updated"));
      setProfile((current) =>
        current ? { ...current, hasProfilePhoto: false } : current,
      );
      setPhotoSaved(true);
    } catch (reason) {
      setPhotoError(
        reason instanceof Error
          ? reason.message
          : "La photo de profil n’a pas pu être supprimée.",
      );
    } finally {
      setIsPhotoSaving(false);
    }
  };

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        eyebrow="Compte utilisateur"
        title="Mon profil"
        description="Gérez vos coordonnées, votre photo et les informations visibles dans votre compte."
      />

      {error && !profile && (
        <p
          role="alert"
          className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-200"
        >
          {error}
        </p>
      )}

      {isLoading ? (
        <div className="surface-card flex min-h-56 items-center justify-center gap-3 p-8 text-sm font-bold text-slate-500">
          <LoaderCircle className="h-5 w-5 animate-spin" /> Chargement du
          profil…
        </div>
      ) : profile ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
          <section className="surface-card overflow-hidden">
            <div className="flex flex-col gap-5 border-b border-slate-100 bg-gradient-to-r from-rose-50 to-white px-5 py-6 dark:border-slate-800 dark:from-rose-950/20 dark:to-slate-900 sm:flex-row sm:items-center sm:px-7">
              <div className="relative h-24 w-24 shrink-0">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={`Photo de profil de ${fullName}`}
                    className="h-24 w-24 rounded-2xl object-cover ring-4 ring-white dark:ring-slate-800"
                  />
                ) : (
                  <span className="flex h-24 w-24 items-center justify-center rounded-2xl bg-[#ff226d] text-2xl font-extrabold text-white ring-4 ring-white dark:ring-slate-800">
                    {initials || <UserRound className="h-9 w-9" />}
                  </span>
                )}
                <button
                  type="button"
                  disabled={isPhotoSaving}
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Changer la photo de profil"
                  className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-xl border-2 border-white bg-slate-900 text-white shadow-md transition hover:bg-[#ff226d] disabled:opacity-60 dark:border-slate-900"
                >
                  {isPhotoSaving ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(event) => void uploadPhoto(event)}
                  className="hidden"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {fullName || "Utilisateur"}
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    {profile.status === "ACTIVE" ? "Compte actif" : "Suspendu"}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                  {profile.email}
                </p>
                <p className="mt-2 text-xs font-semibold text-slate-400">
                  Membre de {profile.organizationName} · Depuis{" "}
                  {formatDate(profile.createdAt)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(profile.roles ?? []).map((role) => (
                    <span
                      key={role}
                      className="rounded-full border border-violet-100 bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-200"
                    >
                      {userRoleLabels[role as UserRole] ?? role}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <form onSubmit={submitProfile} className="space-y-5 p-5 sm:p-7">
              {error && (
                <p
                  role="alert"
                  className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-200"
                >
                  {error}
                </p>
              )}
              {saved && (
                <p
                  role="status"
                  className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" /> Informations
                  enregistrées.
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="field-label">
                  Prénom
                  <input
                    required
                    disabled={isSaving}
                    name="firstName"
                    minLength={2}
                    maxLength={80}
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(event) => {
                      setFirstName(event.target.value);
                      setSaved(false);
                    }}
                    className="field-input"
                  />
                </label>
                <label className="field-label">
                  Nom
                  <input
                    required
                    disabled={isSaving}
                    name="lastName"
                    minLength={2}
                    maxLength={80}
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(event) => {
                      setLastName(event.target.value);
                      setSaved(false);
                    }}
                    className="field-input"
                  />
                </label>
                <label className="field-label">
                  Téléphone
                  <span className="relative block">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      disabled={isSaving}
                      type="tel"
                      name="phone"
                      maxLength={40}
                      autoComplete="tel"
                      value={phone}
                      onChange={(event) => {
                        setPhone(event.target.value);
                        setSaved(false);
                      }}
                      className="field-input pl-10"
                      placeholder="+261 …"
                    />
                  </span>
                </label>
                <label className="field-label">
                  Date de naissance
                  <span className="relative block">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      disabled={isSaving}
                      type="date"
                      name="birthDate"
                      max={currentDateInOrganizationTimeZone()}
                      value={birthDate}
                      onChange={(event) => {
                        setBirthDate(event.target.value);
                        setSaved(false);
                      }}
                      className="field-input pl-10"
                    />
                  </span>
                </label>
                <label className="field-label sm:col-span-2">
                  Adresse e-mail
                  <span className="relative block">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      readOnly
                      value={profile.email}
                      className="field-input cursor-not-allowed pl-10 opacity-75"
                    />
                  </span>
                  <span className="mt-1 block text-xs font-medium text-slate-400">
                    L’adresse e-mail sert à la connexion et ne peut pas être
                    modifiée ici.
                  </span>
                </label>
                <label className="field-label sm:col-span-2">
                  Adresse
                  <span className="relative block">
                    <MapPin className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      disabled={isSaving}
                      name="address"
                      maxLength={255}
                      autoComplete="street-address"
                      value={address}
                      onChange={(event) => {
                        setAddress(event.target.value);
                        setSaved(false);
                      }}
                      className="field-input pl-10"
                      placeholder="Adresse postale"
                    />
                  </span>
                </label>
                <label className="field-label sm:col-span-2">
                  À propos de moi
                  <textarea
                    disabled={isSaving}
                    name="about"
                    maxLength={500}
                    rows={4}
                    value={about}
                    onChange={(event) => {
                      setAbout(event.target.value);
                      setSaved(false);
                    }}
                    className="field-input min-h-28 resize-y py-3"
                    placeholder="Quelques mots pour présenter votre rôle dans l’atelier…"
                  />
                  <span className="mt-1 block text-right text-xs font-medium text-slate-400">
                    {about.length}/500
                  </span>
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <p className="text-xs text-slate-400">
                  Les rôles et l’adresse e-mail sont gérés séparément pour
                  protéger le compte.
                </p>
                <PrimaryButton disabled={isSaving} type="submit" icon={Save}>
                  {isSaving ? "Enregistrement…" : "Enregistrer le profil"}
                </PrimaryButton>
              </div>
            </form>
          </section>

          <aside className="space-y-5">
            <section className="surface-card p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/35 dark:text-blue-300">
                  <ImagePlus className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-extrabold text-slate-900 dark:text-white">
                    Photo de profil
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    JPG ou PNG · 2 Mo maximum
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-400">
                La photo est enregistrée sur votre compte et visible dans votre
                espace utilisateur.
              </p>
              {photoError && (
                <p
                  role="alert"
                  className="mt-3 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-200"
                >
                  {photoError}
                </p>
              )}
              {photoSaved && (
                <p
                  role="status"
                  className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
                >
                  <CheckCircle2 className="h-4 w-4" /> Photo mise à jour.
                </p>
              )}
              <div className="mt-4 flex flex-col gap-2">
                <SecondaryButton
                  disabled={isPhotoSaving}
                  icon={isPhotoSaving ? LoaderCircle : Camera}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isPhotoSaving ? "Envoi…" : "Importer une photo"}
                </SecondaryButton>
                {profile.hasProfilePhoto && (
                  <SecondaryButton
                    disabled={isPhotoSaving}
                    icon={Trash2}
                    onClick={() => void removePhoto()}
                    className="text-rose-600 hover:border-rose-200 hover:bg-rose-50 dark:text-rose-300"
                  >
                    Supprimer la photo
                  </SecondaryButton>
                )}
              </div>
            </section>

            <section className="surface-card p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/35 dark:text-violet-300">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-extrabold text-slate-900 dark:text-white">
                    Compte et accès
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Informations gérées par l’organisation
                  </p>
                </div>
              </div>
              <dl className="mt-5 space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-semibold text-slate-400">
                    Organisation
                  </dt>
                  <dd className="mt-0.5 font-bold text-slate-700 dark:text-slate-200">
                    {profile.organizationName}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-400">
                    Rôles
                  </dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {profile.roles.map((role) => (
                      <span
                        key={role}
                        className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700 dark:bg-violet-950/40 dark:text-violet-200"
                      >
                        {userRoleLabels[role as UserRole] ?? role}
                      </span>
                    ))}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-400">
                    Dernière connexion
                  </dt>
                  <dd className="mt-0.5 font-bold text-slate-700 dark:text-slate-200">
                    {formatDate(profile.lastLoginAt)}
                  </dd>
                </div>
              </dl>
              <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                <h3 className="font-extrabold text-slate-900 dark:text-white">
                  Sécurité du compte
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Le mot de passe actuel sera demandé. Vous devrez vous
                  reconnecter après sa modification.
                </p>
                <SecondaryButton
                  className="mt-4 w-full"
                  icon={KeyRound}
                  onClick={() => setPasswordOpen(true)}
                >
                  Modifier le mot de passe
                </SecondaryButton>
              </div>
            </section>
          </aside>
        </div>
      ) : null}

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
