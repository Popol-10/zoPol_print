import { useState, type FormEvent } from "react";
import { ArrowLeftRight } from "lucide-react";
import type { FinanceAccountMethod, FinanceTransferInput } from "@/lib/finance";
import { Modal, ModalFooter } from "@/components/erp/Modal";
import { PrimaryButton, SecondaryButton } from "@/components/erp/Ui";
import { currencyUnitLabel } from "@/utils/format";

interface FinanceTransferModalProps {
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (input: FinanceTransferInput) => Promise<void>;
}

function localDate(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

export function FinanceTransferModal({
  open,
  saving,
  onClose,
  onSave,
}: FinanceTransferModalProps) {
  const [sourceMethod, setSourceMethod] =
    useState<FinanceAccountMethod>("CASH");
  const [destinationMethod, setDestinationMethod] =
    useState<FinanceAccountMethod>("BANK");
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sourceMethod === destinationMethod) {
      setError("Choisissez deux comptes différents.");
      return;
    }
    const values = new FormData(event.currentTarget);
    const amount = Number(values.get("amount") ?? 0);
    const label = String(values.get("label") ?? "").trim();
    const transactionDate = String(values.get("transactionDate") ?? "");
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setError("Saisissez un montant entier positif.");
      return;
    }
    setError(null);
    try {
      await onSave({
        sourceMethod,
        destinationMethod,
        amount,
        ...(label ? { label } : {}),
        transactionDate,
      });
      onClose();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Le virement n’a pas été enregistré.",
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      title="Transférer entre comptes"
      description="Le registre débitera le compte source et créditera le destinataire sans modifier les revenus ni les dépenses."
      icon={ArrowLeftRight}
      size="md"
    >
      <form onSubmit={submit} className="space-y-5">
        {error ? (
          <p
            role="alert"
            className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-200"
          >
            {error}
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field-label">
            Compte source
            <select
              value={sourceMethod}
              onChange={(event) =>
                setSourceMethod(event.target.value as FinanceAccountMethod)
              }
              className="field-input"
            >
              <option value="CASH">Caisse</option>
              <option value="BANK">Banque</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
            </select>
          </label>
          <label className="field-label">
            Compte destinataire
            <select
              value={destinationMethod}
              onChange={(event) =>
                setDestinationMethod(event.target.value as FinanceAccountMethod)
              }
              className="field-input"
            >
              <option value="CASH">Caisse</option>
              <option value="BANK">Banque</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
            </select>
          </label>
          {sourceMethod === destinationMethod ? (
            <p className="sm:col-span-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
              Sélectionnez deux comptes différents pour le transfert.
            </p>
          ) : null}
          <label className="field-label sm:col-span-2">
            Montant ({currencyUnitLabel()})
            <input
              required
              name="amount"
              type="number"
              min="1"
              max="1000000000000"
              step="1"
              className="field-input"
              placeholder="50000"
            />
          </label>
          <label className="field-label sm:col-span-2">
            Libellé (facultatif)
            <input
              name="label"
              type="text"
              maxLength={120}
              className="field-input"
              placeholder="Ex. Dépôt à la banque"
            />
          </label>
          <label className="field-label sm:col-span-2">
            Date du virement
            <input
              required
              name="transactionDate"
              type="date"
              defaultValue={localDate()}
              className="field-input"
            />
          </label>
        </div>
        <ModalFooter>
          <SecondaryButton disabled={saving} onClick={onClose}>
            Annuler
          </SecondaryButton>
          <PrimaryButton
            type="submit"
            disabled={saving || sourceMethod === destinationMethod}
          >
            {saving ? "Enregistrement…" : "Confirmer le virement"}
          </PrimaryButton>
        </ModalFooter>
      </form>
    </Modal>
  );
}
