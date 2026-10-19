import { useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "@/lib/auth";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const token = searchParams.get("token") ?? "";

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmation) {
      setError("La confirmation ne correspond pas au nouveau mot de passe.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      await authApi.resetPassword({ token, newPassword: password });
      navigate("/connexion", { replace: true, state: { passwordReset: true } });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Le lien est invalide ou a expiré.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[#f8f8fc] p-4 text-slate-900">
      <section className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-[0_30px_80px_-42px_rgba(55,50,90,.45)] sm:p-9">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-[#ff226d]"><KeyRound className="h-5 w-5" /></span>
        <p className="mt-6 text-xs font-black uppercase tracking-[.16em] text-[#ff226d]">MAK’ART</p>
        <h1 className="mt-2 text-2xl font-black">Définissez un nouveau mot de passe</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Votre nouveau mot de passe vous donnera accès à votre espace atelier.</p>
        {!token ? (
          <p role="alert" className="mt-6 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">Le lien de réinitialisation est incomplet. Demandez-en un nouveau.</p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p>}
            <label className="block text-sm font-bold text-slate-700">Nouveau mot de passe<span className="relative mt-1.5 block"><input required minLength={8} type={visible ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" className="h-12 w-full rounded-xl border border-slate-200 px-3 pr-11 text-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100" /><button type="button" onClick={() => setVisible((value) => !value)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}>{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span></label>
            <label className="block text-sm font-bold text-slate-700">Confirmer le mot de passe<input required minLength={8} type={visible ? "text" : "password"} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" className="mt-1.5 h-12 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100" /></label>
            <p className="text-xs leading-5 text-slate-500">Au moins 8 caractères, avec une minuscule, une majuscule et un chiffre.</p>
            <button disabled={saving} type="submit" className="flex h-12 w-full items-center justify-center rounded-xl bg-[#ff226d] text-sm font-extrabold text-white shadow-[0_14px_25px_-14px_rgba(255,34,109,.85)] disabled:opacity-60">{saving ? "Enregistrement…" : "Enregistrer le mot de passe"}</button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-slate-500"><Link to="/connexion" className="font-extrabold text-[#e91f63] hover:underline">Retour à la connexion</Link></p>
      </section>
    </main>
  );
}
