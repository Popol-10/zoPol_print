import { type FormEvent, useState } from "react";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ForgotPasswordModal } from "@/components/auth/ForgotPasswordModal";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/auth";

type AuthMode = "login" | "register";

type AuthForm = {
  organizationName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type AuthLocationState = {
  from?: { pathname?: string };
  passwordChanged?: boolean;
  passwordReset?: boolean;
};

const emptyForm: AuthForm = {
  organizationName: "",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const inputClassName =
  "mt-1.5 h-12 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100";

function registrationPasswordError(form: AuthForm): string | null {
  if (form.password !== form.confirmPassword) {
    return "Les deux mots de passe ne correspondent pas.";
  }

  const isStrongPassword =
    form.password.length >= 8 &&
    /[a-z]/.test(form.password) &&
    /[A-Z]/.test(form.password) &&
    /[0-9]/.test(form.password);

  return isStrongPassword
    ? null
    : "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.";
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  hint?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <label className="block text-sm font-bold text-slate-700" htmlFor={id}>
      {label}
      <span className="relative mt-1.5 block">
        <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          required
          minLength={8}
          autoComplete={autoComplete}
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full rounded-xl border border-slate-200 py-2 pl-10 pr-11 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={() => setIsVisible((visible) => !visible)}
          aria-label={
            isVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"
          }
          aria-pressed={isVisible}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100"
        >
          {isVisible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </span>
      {hint ? (
        <span className="mt-1.5 block text-xs font-medium text-slate-500">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export default function AuthPage({ mode }: { mode: AuthMode }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isRegister = mode === "register";
  const state = location.state as AuthLocationState | null;
  const [form, setForm] = useState<AuthForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const updateField = (field: keyof AuthForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (error) setError(null);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isRegister) {
      const validationError = registrationPasswordError(form);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const credentials = {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      };

      if (isRegister) {
        await register({
          ...credentials,
          organizationName: form.organizationName.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
        });
      } else {
        await login(credentials);
      }

      navigate(state?.from?.pathname ?? "/dashboard", { replace: true });
    } catch (reason) {
      setError(
        reason instanceof ApiError || reason instanceof Error
          ? reason.message
          : "Une erreur est survenue. Réessayez dans un instant.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f8fc] p-4 text-slate-900 sm:p-7">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-[28px] bg-white shadow-[0_30px_80px_-42px_rgba(55,50,90,.45)] lg:grid-cols-[.92fr_1.08fr]">
        <section className="relative hidden overflow-hidden bg-slate-900 p-10 text-white lg:flex lg:flex-col">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#ff226d]/90 blur-2xl" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-blue-500/50 blur-2xl" />
          <div className="relative">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-lg font-black ring-1 ring-white/20">
              M
            </div>
            <p className="mt-7 text-sm font-bold uppercase tracking-[.2em] text-rose-200">
              MAK’ART
            </p>
            <h1 className="mt-3 max-w-sm text-4xl font-black leading-tight">
              L’atelier, connecté à votre équipe.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-slate-300">
              Pilotez vos commandes, votre production et vos finances depuis un
              espace sécurisé.
            </p>
          </div>
          <div className="relative mt-auto space-y-4">
            <div className="flex gap-3 rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-rose-200" />
              <p className="text-sm">
                <b className="block">Accès sécurisé</b>
                <span className="text-slate-300">
                  Votre session et vos données sont protégées.
                </span>
              </p>
            </div>
            <div className="flex gap-3 rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <UserRound className="mt-0.5 h-5 w-5 shrink-0 text-rose-200" />
              <p className="text-sm">
                <b className="block">Une équipe, un espace</b>
                <span className="text-slate-300">
                  Les droits s’adaptent au rôle de chacun.
                </span>
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center px-5 py-10 sm:px-12 lg:px-16">
          <div className="mx-auto w-full max-w-md">
            <div className="lg:hidden">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 font-black text-[#ff226d]">
                M
              </span>
              <p className="mt-3 text-xs font-black uppercase tracking-[.16em] text-[#ff226d]">
                MAK’ART
              </p>
            </div>

            <p className="mt-7 text-sm font-bold text-[#ff226d]">
              {isRegister ? "Premier accès" : "Bon retour"}
            </p>
            <h2 className="mt-1 text-3xl font-black tracking-tight">
              {isRegister
                ? "Créez votre espace atelier"
                : "Connectez-vous à votre espace"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {isRegister
                ? "Créez l’organisation et le premier compte administrateur."
                : "Utilisez les identifiants fournis par l’administrateur de votre atelier."}
            </p>

            {state?.passwordChanged && !isRegister ? (
              <p
                role="status"
                className="mt-5 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700"
              >
                Mot de passe modifié. Connectez-vous avec votre nouveau mot de
                passe.
              </p>
            ) : null}
            {state?.passwordReset && !isRegister ? (
              <p
                role="status"
                className="mt-5 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700"
              >
                Mot de passe réinitialisé. Vous pouvez maintenant vous
                connecter.
              </p>
            ) : null}
            {error ? (
              <p
                role="alert"
                className="mt-5 rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-700"
              >
                {error}
              </p>
            ) : null}

            <form
              onSubmit={submit}
              className="mt-7 space-y-4"
              aria-busy={isSubmitting}
            >
              {isRegister ? (
                <>
                  <label
                    className="block text-sm font-bold text-slate-700"
                    htmlFor="organizationName"
                  >
                    Nom de l’atelier
                    <input
                      id="organizationName"
                      required
                      minLength={2}
                      value={form.organizationName}
                      onChange={(event) =>
                        updateField("organizationName", event.target.value)
                      }
                      autoComplete="organization"
                      className={inputClassName}
                      placeholder="Ex. MAK’ART"
                    />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label
                      className="block text-sm font-bold text-slate-700"
                      htmlFor="firstName"
                    >
                      Prénom
                      <input
                        id="firstName"
                        required
                        minLength={2}
                        value={form.firstName}
                        onChange={(event) =>
                          updateField("firstName", event.target.value)
                        }
                        autoComplete="given-name"
                        className={inputClassName}
                        placeholder="Mamy"
                      />
                    </label>
                    <label
                      className="block text-sm font-bold text-slate-700"
                      htmlFor="lastName"
                    >
                      Nom
                      <input
                        id="lastName"
                        required
                        minLength={2}
                        value={form.lastName}
                        onChange={(event) =>
                          updateField("lastName", event.target.value)
                        }
                        autoComplete="family-name"
                        className={inputClassName}
                        placeholder="Rakoto"
                      />
                    </label>
                  </div>
                </>
              ) : null}

              <label
                className="block text-sm font-bold text-slate-700"
                htmlFor="email"
              >
                Adresse e-mail
                <span className="relative mt-1.5 block">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    required
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateField("email", event.target.value)
                    }
                    autoComplete="email"
                    className="h-12 w-full rounded-xl border border-slate-200 py-2 pl-10 pr-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                    placeholder="vous.mg"
                  />
                </span>
              </label>

              <PasswordField
                id="password"
                label="Mot de passe"
                value={form.password}
                onChange={(value) => updateField("password", value)}
                autoComplete={isRegister ? "new-password" : "current-password"}
                hint={
                  isRegister
                    ? "8 caractères minimum, avec majuscule, minuscule et chiffre."
                    : undefined
                }
              />
              {isRegister ? (
                <PasswordField
                  id="confirmPassword"
                  label="Confirmer le mot de passe"
                  value={form.confirmPassword}
                  onChange={(value) => updateField("confirmPassword", value)}
                  autoComplete="new-password"
                />
              ) : null}

              <button
                disabled={isSubmitting}
                type="submit"
                className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-[#ff226d] px-4 text-sm font-extrabold text-white shadow-[0_14px_25px_-14px_rgba(255,34,109,.85)] transition hover:bg-[#e91f63] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? "Veuillez patienter…"
                  : isRegister
                    ? "Créer mon espace"
                    : "Se connecter"}
              </button>

              {!isRegister ? (
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="mx-auto block text-sm font-extrabold text-[#e91f63] hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              ) : null}
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              {isRegister
                ? "Vous avez déjà un compte ?"
                : "Premier accès à MAK’ART ?"}{" "}
              <Link
                className="font-extrabold text-[#e91f63] hover:underline"
                to={isRegister ? "/connexion" : "/inscription"}
              >
                {isRegister ? "Se connecter" : "Créer l’espace"}
              </Link>
            </p>

            <ForgotPasswordModal
              open={isForgotPasswordOpen}
              onClose={() => setIsForgotPasswordOpen(false)}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
