import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  SlidersHorizontal,
} from "lucide-react";
import type {
  StockAdjustmentDirection,
  StockItemRecord,
  StockMovementInput,
  StockMovementKind,
} from "@/lib/stock";
import { ApiError } from "@/lib/api";
import { Modal, ModalFooter } from "@/components/erp/Modal";
import { PrimaryButton, SecondaryButton } from "@/components/erp/Ui";

type MovementFormKind = "entry" | "exit" | "adjustment";

interface StockMovementModalProps {
  open: boolean;
  onClose: () => void;
  items: StockItemRecord[];
  initialItemId?: string;
  initialKind?: MovementFormKind;
  onSave: (movement: StockMovementInput) => Promise<void>;
}

const labels: Record<MovementFormKind, string> = {
  entry: "Entrée",
  exit: "Sortie",
  adjustment: "Ajustement",
};

const apiKind: Record<MovementFormKind, StockMovementKind> = {
  entry: "ENTRY",
  exit: "EXIT",
  adjustment: "ADJUSTMENT",
};

function getErrorMessage(reason: unknown): string {
  return reason instanceof ApiError || reason instanceof Error
    ? reason.message
    : "L’enregistrement du mouvement a échoué.";
}

export function StockMovementModal({
  open,
  onClose,
  items,
  initialItemId,
  initialKind = "adjustment",
  onSave,
}: StockMovementModalProps) {
  const [kind, setKind] = useState<MovementFormKind>(initialKind);
  const [itemId, setItemId] = useState(initialItemId ?? items[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setKind(initialKind);
    setItemId(initialItemId ?? items[0]?.id ?? "");
    setError(null);
  }, [initialItemId, initialKind, items, open]);

  const close = () => {
    if (!saving) onClose();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const values = new FormData(event.currentTarget);
    const quantity = Number(values.get("quantity") ?? 0);
    if (!itemId || quantity <= 0) return;

    const direction = String(
      values.get("direction") ?? "INCREASE",
    ) as StockAdjustmentDirection;
    try {
      setSaving(true);
      setError(null);
      await onSave({
        itemId,
        kind: apiKind[kind],
        quantity,
        ...(kind === "adjustment" ? { direction } : {}),
        source: String(values.get("source") ?? "").trim() || null,
        notes: String(values.get("notes") ?? "").trim() || null,
      });
      onClose();
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setSaving(false);
    }
  };

  const icon =
    kind === "entry"
      ? ArrowDownToLine
      : kind === "exit"
        ? ArrowUpFromLine
        : SlidersHorizontal;

  return (
    <Modal
      open={open}
      onClose={close}
      title="Mouvement de stock"
      description="Chaque mouvement est enregistré dans l’historique de l’article."
      icon={icon}
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
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800">
          {(Object.keys(labels) as MovementFormKind[]).map((value) => (
            <button
              type="button"
              key={value}
              onClick={() => setKind(value)}
              className={`min-h-11 rounded-xl px-2 text-xs font-extrabold transition ${kind === value ? "bg-white text-[#ff226d] shadow-sm dark:bg-slate-900" : "text-slate-500"}`}
            >
              {labels[value]}
            </button>
          ))}
        </div>

        <label className="field-label">
          Article de stock interne
          <select
            required
            value={itemId}
            onChange={(event) => setItemId(event.target.value)}
            className="field-input"
          >
            {items.map((item) => (
              <option value={item.id} key={item.id}>
                {item.name} · {item.quantity} {item.unit}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field-label">
            Quantité
            <input
              required
              name="quantity"
              type="number"
              min="1"
              max="2147483647"
              step="1"
              defaultValue="1"
              className="field-input"
            />
          </label>
          {kind === "adjustment" ? (
            <label className="field-label">
              Sens de l’ajustement
              <select name="direction" className="field-input">
                <option value="INCREASE">Ajouter au stock</option>
                <option value="DECREASE">Retirer du stock</option>
              </select>
            </label>
          ) : (
            <label className="field-label">
              Origine / destination
              <input
                name="source"
                maxLength={160}
                className="field-input"
                placeholder={kind === "entry" ? "Fournisseur" : "Production"}
              />
            </label>
          )}
        </div>

        {kind === "adjustment" ? (
          <label className="field-label">
            Origine / destination
            <input
              name="source"
              maxLength={160}
              className="field-input"
              placeholder="Ex. Inventaire"
            />
          </label>
        ) : null}

        <label className="field-label">
          Note interne
          <textarea
            name="notes"
            maxLength={2000}
            rows={3}
            className="field-input h-auto resize-none py-3"
            placeholder="Ex. Réception bon de livraison #245"
          />
        </label>

        <ModalFooter>
          <SecondaryButton disabled={saving} onClick={close}>
            Annuler
          </SecondaryButton>
          <PrimaryButton disabled={saving || items.length === 0} type="submit">
            {saving ? "Enregistrement…" : "Valider le mouvement"}
          </PrimaryButton>
        </ModalFooter>
      </form>
    </Modal>
  );
}
