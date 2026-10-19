import { useEffect, useState, type FormEvent } from "react";
import { ArrowDownRight, ArrowUpRight, WalletCards } from "lucide-react";
import { Modal, ModalFooter } from "@/components/erp/Modal";
import { PrimaryButton, SecondaryButton } from "@/components/erp/Ui";
import { currencyUnitLabel } from "@/utils/format";
import {
  type FinanceAccountMethod,
  type FinanceTransactionCategory,
  type FinanceTransactionInput,
  type FinanceTransactionType,
} from "@/lib/finance";

interface TransactionFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (transaction: FinanceTransactionInput) => Promise<void>;
  initialType?: FinanceTransactionType;
}

function localDateValue(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

export function TransactionFormModal({
  open,
  onClose,
  onSave,
  initialType = "INCOME",
}: TransactionFormModalProps) {
  const [type, setType] = useState<FinanceTransactionType>(initialType);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setType(initialType);
      setError(null);
    }
  }, [initialType, open]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const label = String(values.get("label") ?? "").trim();
    const amount = Number(values.get("amount") ?? 0);
    const method = String(values.get("method")) as FinanceAccountMethod;
    const transactionDate = String(values.get("transactionDate") ?? "");
    const category = String(
      values.get("category") ?? "",
    ) as FinanceTransactionCategory;

    if (!label || !Number.isSafeInteger(amount) || amount <= 0) {
      setError("Saisissez un libellé et un montant entier positif.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        type,
        label,
        ...(type === "OPENING_BALANCE" ? {} : { category }),
        method,
        amount,
        transactionDate,
      });
      onClose();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "L’opération n’a pas été enregistrée.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const isIncome = type === "INCOME";
  const title =
    type === "OPENING_BALANCE"
      ? "Enregistrer un solde initial"
      : isIncome
        ? "Ajouter une entrée"
        : "Ajouter une sortie";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description="Les opérations enregistrées restent dans le journal financier."
      icon={type === "EXPENSE" ? ArrowDownRight : ArrowUpRight}
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setType("INCOME")}
            className={
              "flex min-h-11 items-center justify-center gap-2 rounded-xl text-xs font-extrabold transition sm:text-sm " +
              (type === "INCOME"
                ? "bg-white text-emerald-600 shadow-sm dark:bg-slate-900"
                : "text-slate-500")
            }
          >
            <ArrowUpRight className="h-4 w-4" /> Entrée
          </button>
          <button
            type="button"
            onClick={() => setType("EXPENSE")}
            className={
              "flex min-h-11 items-center justify-center gap-2 rounded-xl text-xs font-extrabold transition sm:text-sm " +
              (type === "EXPENSE"
                ? "bg-white text-rose-600 shadow-sm dark:bg-slate-900"
                : "text-slate-500")
            }
          >
            <ArrowDownRight className="h-4 w-4" /> Sortie
          </button>
          <button
            type="button"
            onClick={() => setType("OPENING_BALANCE")}
            className={
              "flex min-h-11 items-center justify-center rounded-xl px-1 text-xs font-extrabold transition sm:text-sm " +
              (type === "OPENING_BALANCE"
                ? "bg-white text-blue-600 shadow-sm dark:bg-slate-900"
                : "text-slate-500")
            }
          >
            Solde initial
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field-label sm:col-span-2">
            Libellé de l’opération
            <input
              required
              autoFocus
              name="label"
              maxLength={160}
              className="field-input"
              placeholder={
                type === "OPENING_BALANCE"
                  ? "Ex. Solde au démarrage du registre"
                  : isIncome
                    ? "Ex. Règlement CMD-2432"
                    : "Ex. Achat emballages"
              }
            />
          </label>
          <label className="field-label">
            Montant ({currencyUnitLabel()})
            <input
              required
              name="amount"
              type="number"
              min={1}
              max={1000000000000}
              step={1}
              className="field-input"
              placeholder="150000"
            />
          </label>
          <label className="field-label">
            Compte
            <select name="method" className="field-input" defaultValue="CASH">
              <option value="CASH">Caisse</option>
              <option value="BANK">Banque</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
            </select>
          </label>
          {type !== "OPENING_BALANCE" && (
            <label className="field-label sm:col-span-2">
              Catégorie
              <select
                name="category"
                className="field-input"
                defaultValue={isIncome ? "SALES" : "GENERAL_EXPENSE"}
              >
                {isIncome ? (
                  <>
                    <option value="SALES">Vente</option>
                    <option value="OTHER_INCOME">Autre revenu</option>
                  </>
                ) : (
                  <>
                    <option value="GENERAL_EXPENSE">Frais généraux</option>
                    <option value="INTERNAL_PURCHASE">Achats internes</option>
                    <option value="LOGISTICS">Logistique</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="OTHER_EXPENSE">Autre dépense</option>
                  </>
                )}
              </select>
            </label>
          )}
        </div>
        <label className="field-label">
          Date de l’opération
          <input
            className="field-input"
            name="transactionDate"
            type="date"
            required
            defaultValue={localDateValue()}
          />
        </label>

        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800">
          <WalletCards className="h-5 w-5 shrink-0 text-[#ff226d]" />
          Les corrections se font en enregistrant une opération compensatrice.
        </div>
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
          >
            {error}
          </p>
        )}

        <ModalFooter>
          <SecondaryButton onClick={onClose} disabled={isSaving}>
            Annuler
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={isSaving}>
            {isSaving ? "Enregistrement…" : "Enregistrer"}
          </PrimaryButton>
        </ModalFooter>
      </form>
    </Modal>
  );
}
