import { useEffect, useState, type FormEvent } from "react";
import { Banknote } from "lucide-react";
import type {
  FinanceAccountMethod,
  FinanceOrderPaymentInput,
} from "@/lib/finance";
import { Modal, ModalFooter } from "@/components/erp/Modal";
import { PrimaryButton, SecondaryButton } from "@/components/erp/Ui";
import { currencyUnitLabel, formatAr } from "@/utils/format";

interface OrderPaymentModalProps {
  open: boolean;
  orderNumber: string;
  remaining: number;
  onClose: () => void;
  onSave: (input: FinanceOrderPaymentInput) => Promise<void>;
}

function localDate(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function OrderPaymentModal({
  open,
  orderNumber,
  remaining,
  onClose,
  onSave,
}: OrderPaymentModalProps) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<FinanceAccountMethod>("CASH");
  const [transactionDate, setTransactionDate] = useState(localDate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const maxAmount = Math.floor(remaining);

  useEffect(() => {
    if (!open) return;
    setAmount(String(maxAmount));
    setMethod("CASH");
    setTransactionDate(localDate());
    setError(null);
  }, [open, maxAmount]);

  const close = () => {
    if (!saving) onClose();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const paymentAmount = Number(amount);
    if (
      !Number.isInteger(paymentAmount) ||
      paymentAmount < 1 ||
      paymentAmount > maxAmount
    ) {
      setError(
        "Le montant doit être positif et ne pas dépasser le reste à payer.",
      );
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await onSave({ amount: paymentAmount, method, transactionDate });
      onClose();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Impossible d’enregistrer ce paiement.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Enregistrer un paiement"
      description={`Commande ${orderNumber}. Le règlement sera ajouté au registre Finance.`}
      icon={Banknote}
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
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Reste dû
          </p>
          <p className="mt-1 text-xl font-extrabold">{formatAr(remaining)}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field-label sm:col-span-2">
            Montant reçu ({currencyUnitLabel()})
            <input
              required
              autoFocus
              type="number"
              min="1"
              max={maxAmount}
              step="1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="field-input"
              disabled={maxAmount < 1}
            />
          </label>
          <label className="field-label">
            Compte destinataire
            <select
              value={method}
              onChange={(event) =>
                setMethod(event.target.value as FinanceAccountMethod)
              }
              className="field-input"
            >
              <option value="CASH">Caisse</option>
              <option value="BANK">Banque</option>
              <option value="MOBILE_MONEY">Mobile money</option>
            </select>
          </label>
          <label className="field-label">
            Date du règlement
            <input
              required
              type="date"
              value={transactionDate}
              onChange={(event) => setTransactionDate(event.target.value)}
              className="field-input"
            />
          </label>
        </div>
        <ModalFooter>
          <SecondaryButton disabled={saving} onClick={close}>
            Annuler
          </SecondaryButton>
          <PrimaryButton disabled={saving || maxAmount < 1} type="submit">
            {saving ? "Enregistrement…" : "Confirmer le paiement"}
          </PrimaryButton>
        </ModalFooter>
      </form>
    </Modal>
  );
}
