import { useState } from "react";
import { Mail } from "lucide-react";
import { authApi } from "@/lib/auth";
import { Modal, ModalFooter } from "@/components/erp/Modal";
import { PrimaryButton, SecondaryButton } from "@/components/erp/Ui";

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ open, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);

  const close = () => {
    if (saving) return;
    setError("");
    setSent(false);
    onClose();
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "La demande a échoué.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Mot de passe oublié" description="Nous vous guiderons pour retrouver l’accès à votre espace." icon={Mail}>
      {sent ? (
        <div className="space-y-5">
          <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm leading-6 font-semibold text-emerald-700">
            Si cette adresse est associée à un compte, un lien de réinitialisation vient d’être envoyé.
          </p>
          <ModalFooter><PrimaryButton onClick={close}>Fermer</PrimaryButton></ModalFooter>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p>}
          <label className="field-label">Adresse e-mail<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="field-input" placeholder="vous@entreprise.mg" /></label>
          <p className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500 dark:bg-slate-800">Par sécurité, le même message sera affiché que l’adresse existe ou non.</p>
          <ModalFooter>
            <SecondaryButton disabled={saving} onClick={close}>Annuler</SecondaryButton>
            <PrimaryButton disabled={saving} type="submit">{saving ? "Envoi…" : "Envoyer le lien"}</PrimaryButton>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}
