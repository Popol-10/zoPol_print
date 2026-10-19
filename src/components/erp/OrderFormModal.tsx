import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ClipboardPlus } from "lucide-react";
import { ApiError } from "@/lib/api";
import { readAuthSession } from "@/lib/auth";
import { clientsApi, type ClientRecord } from "@/lib/clients";
import type { CreateOrderInput, OrderPriority } from "@/lib/orders";
import { productsApi, type ProductRecord } from "@/lib/products";
import { formatAr } from "@/utils/format";
import { Modal, ModalFooter } from "@/components/erp/Modal";
import { PrimaryButton, SecondaryButton } from "@/components/erp/Ui";

interface OrderFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (input: CreateOrderInput) => Promise<void>;
}

function errorMessage(reason: unknown): string {
  return reason instanceof Error
    ? reason.message
    : "Impossible d’enregistrer la commande.";
}

export function OrderFormModal({ open, onClose, onSave }: OrderFormModalProps) {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [clientId, setClientId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [priority, setPriority] = useState<OrderPriority>("Normale");
  const [dueDate, setDueDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const loadReferences = async () => {
      const session = readAuthSession();
      if (!session) {
        setError("Votre session a expiré. Reconnectez-vous.");
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const [clientRows, productRows] = await Promise.all([
          clientsApi.list(session.tokens.accessToken),
          productsApi.list(session.tokens.accessToken),
        ]);
        if (!active) return;
        setClients(clientRows);
        setProducts(productRows);
        setClientId((current) =>
          clientRows.some((client) => client.id === current)
            ? current
            : (clientRows[0]?.id ?? ""),
        );
        setProductId((current) =>
          productRows.some((product) => product.id === current)
            ? current
            : (productRows[0]?.id ?? ""),
        );
      } catch (reason) {
        if (active) setError(errorMessage(reason));
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void loadReferences();
    return () => {
      active = false;
    };
  }, [open]);

  const product = useMemo(
    () => products.find((item) => item.id === productId) ?? null,
    [products, productId],
  );
  const safeQuantity = Number.isFinite(quantity) ? Math.max(1, quantity) : 1;
  const total = product ? product.price * safeQuantity : 0;
  const canSubmit = Boolean(
    !isLoading && !saving && clientId && productId && product,
  );

  const close = () => {
    if (!saving) onClose();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || !product) return;
    const input: CreateOrderInput = {
      clientId,
      productId,
      quantity: safeQuantity,
      priority,
      dueDate: dueDate || null,
    };
    try {
      setSaving(true);
      setError(null);
      await onSave(input);
      onClose();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Nouvelle commande"
      description="Choisissez un client et un produit du catalogue. Les règlements se saisissent depuis le détail de la commande."
      icon={ClipboardPlus}
      size="lg"
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
        {isLoading ? (
          <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800">
            Chargement des clients et produits…
          </p>
        ) : null}
        {!isLoading && clients.length === 0 ? (
          <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            Ajoutez d’abord un client dans le module Clients.
          </p>
        ) : null}
        {!isLoading && products.length === 0 ? (
          <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            Ajoutez d’abord un produit fabriqué dans le catalogue Produits.
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field-label sm:col-span-2">
            Client
            <select
              required
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              className="field-input"
              disabled={isLoading || clients.length === 0}
            >
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                  {client.company ? ` · ${client.company}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label sm:col-span-2">
            Produit fabriqué
            <select
              required
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
              className="field-input"
              disabled={isLoading || products.length === 0}
            >
              {products.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {formatAr(item.price)}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Quantité
            <input
              required
              type="number"
              min="1"
              max="2147483647"
              step="1"
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
              className="field-input"
            />
          </label>
          <label className="field-label">
            Priorité
            <select
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value as OrderPriority)
              }
              className="field-input"
            >
              <option value="Normale">Normale</option>
              <option value="Haute">Haute</option>
              <option value="Urgente">Urgente</option>
            </select>
          </label>
          <label className="field-label">
            Échéance prévue
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="field-input"
            />
          </label>
        </div>

        <section className="rounded-2xl bg-slate-900 p-4 text-white">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-slate-300">Production prévue</span>
            <b>{product?.machine ?? "À définir"}</b>
          </div>
          <div className="mt-2 flex items-center justify-between gap-4 text-sm">
            <span className="text-slate-300">Total commande</span>
            <b className="text-lg text-rose-200">{formatAr(total)}</b>
          </div>
        </section>

        <ModalFooter>
          <SecondaryButton disabled={saving} onClick={close}>
            Annuler
          </SecondaryButton>
          <PrimaryButton disabled={!canSubmit} type="submit">
            {saving ? "Enregistrement…" : "Créer la commande"}
          </PrimaryButton>
        </ModalFooter>
      </form>
    </Modal>
  );
}
