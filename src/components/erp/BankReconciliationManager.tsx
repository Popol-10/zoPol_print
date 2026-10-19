import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Check, ClipboardCheck, Plus, RotateCcw, X } from "lucide-react";
import { Modal, ModalFooter } from "@/components/erp/Modal";
import { PrimaryButton, SecondaryButton } from "@/components/erp/Ui";
import {
  financeApi,
  type BankReconciliationDetail,
  type BankReconciliationSummary,
  type CreateBankReconciliationInput,
  type FinanceTransactionRecord,
} from "@/lib/finance";
import { readAuthSession } from "@/lib/auth";
import { currencyUnitLabel, formatAr } from "@/utils/format";

function token(): string {
  const session = readAuthSession();
  if (!session) throw new Error("Votre session a expiré. Reconnectez-vous.");
  return session.tokens.accessToken;
}

function localDateValue(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function dateLabel(value: string): string {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function signedAmount(transaction: FinanceTransactionRecord): number {
  return ["EXPENSE", "TRANSFER_OUT"].includes(transaction.type)
    ? -transaction.amount
    : transaction.amount;
}

function statusLabel(status: BankReconciliationSummary["status"]): string {
  if (status === "RECONCILED") return "Rapproché";
  if (status === "CANCELLED") return "Annulé";
  return "En cours";
}

export function BankReconciliationManager() {
  const [sessions, setSessions] = useState<BankReconciliationSummary[]>([]);
  const [detail, setDetail] = useState<BankReconciliationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      setSessions(await financeApi.listReconciliations(token()));
      setError(null);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Les rapprochements n’ont pas pu être chargés.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const applyDetail = (next: BankReconciliationDetail) => {
    setDetail(next);
    setSessions((current) =>
      [next, ...current.filter((session) => session.id !== next.id)].slice(
        0,
        24,
      ),
    );
  };

  const openSession = async (id: string) => {
    setSaving(true);
    setError(null);
    try {
      applyDetail(await financeApi.getReconciliation(token(), id));
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Le rapprochement n’a pas pu être chargé.",
      );
    } finally {
      setSaving(false);
    }
  };

  const createSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const input: CreateBankReconciliationInput = {
      periodStart: String(values.get("periodStart") ?? ""),
      periodEnd: String(values.get("periodEnd") ?? ""),
      statementOpeningBalance: Number(values.get("statementOpeningBalance")),
      statementClosingBalance: Number(values.get("statementClosingBalance")),
    };
    if (
      input.periodStart > input.periodEnd ||
      !Number.isSafeInteger(input.statementOpeningBalance) ||
      !Number.isSafeInteger(input.statementClosingBalance)
    ) {
      setError(
        `Vérifiez les dates et saisissez des soldes entiers en ${currencyUnitLabel()}.`,
      );
      return;
    }
    setSaving(true);
    setError(null);
    try {
      applyDetail(await financeApi.createReconciliation(token(), input));
      setCreateOpen(false);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Le rapprochement n’a pas pu être créé.",
      );
    } finally {
      setSaving(false);
    }
  };

  const setMatched = async (transactionId: string, matched: boolean) => {
    if (!detail) return;
    setSaving(true);
    setError(null);
    try {
      applyDetail(
        await financeApi.setReconciliationMatch(
          token(),
          detail.id,
          transactionId,
          matched,
        ),
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Le pointage n’a pas été modifié.",
      );
    } finally {
      setSaving(false);
    }
  };

  const completeSession = async () => {
    if (!detail) return;
    setSaving(true);
    setError(null);
    try {
      applyDetail(await financeApi.completeReconciliation(token(), detail.id));
      await loadSessions();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Le rapprochement ne peut pas être terminé.",
      );
    } finally {
      setSaving(false);
    }
  };

  const cancelSession = async () => {
    if (!detail) return;
    setSaving(true);
    setError(null);
    try {
      applyDetail(await financeApi.cancelReconciliation(token(), detail.id));
      await loadSessions();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Le rapprochement ne peut pas être annulé.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="surface-card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div>
          <h2 className="font-extrabold">Rapprochements bancaires</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Pointez les mouvements du registre avec votre relevé et vérifiez le
            solde de clôture.
          </p>
        </div>
        <PrimaryButton
          icon={Plus}
          onClick={() => {
            setError(null);
            setCreateOpen(true);
          }}
        >
          Nouvelle période
        </PrimaryButton>
      </div>
      {error && !detail ? (
        <p
          role="alert"
          className="m-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700"
        >
          {error}
        </p>
      ) : null}
      {loading ? (
        <p className="p-5 text-sm text-slate-500">
          Chargement des rapprochements…
        </p>
      ) : sessions.length ? (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-bold">
                  {dateLabel(session.periodStart)} –{" "}
                  {dateLabel(session.periodEnd)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Solde relevé {formatAr(session.statementClosingBalance)} ·
                  écart {formatAr(session.difference)} · {session.matchedCount}/
                  {session.transactionCount} mouvements pointés
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${session.status === "RECONCILED" ? "bg-emerald-50 text-emerald-700" : session.status === "CANCELLED" ? "bg-slate-100 text-slate-500" : "bg-amber-50 text-amber-700"}`}
                >
                  {statusLabel(session.status)}
                </span>
                <SecondaryButton
                  disabled={saving}
                  onClick={() => void openSession(session.id)}
                >
                  Détail
                </SecondaryButton>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="p-5 text-sm text-slate-500">
          Aucun rapprochement créé pour le moment.
        </p>
      )}

      <Modal
        open={createOpen}
        onClose={() => !saving && setCreateOpen(false)}
        title="Nouveau rapprochement"
        description="Saisissez les soldes du relevé bancaire. Les mouvements du registre seront pointés séparément."
        icon={ClipboardCheck}
      >
        <form onSubmit={createSession} className="space-y-5">
          {error ? (
            <p
              role="alert"
              className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700"
            >
              {error}
            </p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field-label">
              Début de période
              <input
                required
                type="date"
                name="periodStart"
                defaultValue={localDateValue(
                  new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                )}
                className="field-input"
              />
            </label>
            <label className="field-label">
              Fin de période
              <input
                required
                type="date"
                name="periodEnd"
                defaultValue={localDateValue(new Date())}
                className="field-input"
              />
            </label>
            <label className="field-label">
              Solde initial du relevé ({currencyUnitLabel()})
              <input
                required
                type="number"
                name="statementOpeningBalance"
                step="1"
                min="-1000000000000"
                max="1000000000000"
                defaultValue="0"
                className="field-input"
              />
            </label>
            <label className="field-label">
              Solde final du relevé ({currencyUnitLabel()})
              <input
                required
                type="number"
                name="statementClosingBalance"
                step="1"
                min="-1000000000000"
                max="1000000000000"
                defaultValue="0"
                className="field-input"
              />
            </label>
          </div>
          <ModalFooter>
            <SecondaryButton
              disabled={saving}
              onClick={() => setCreateOpen(false)}
            >
              Annuler
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "Création…" : "Créer le rapprochement"}
            </PrimaryButton>
          </ModalFooter>
        </form>
      </Modal>

      <Modal
        open={Boolean(detail)}
        onClose={() => !saving && setDetail(null)}
        title="Pointage du relevé bancaire"
        description={
          detail
            ? `${dateLabel(detail.periodStart)} – ${dateLabel(detail.periodEnd)} · ${statusLabel(detail.status)}`
            : undefined
        }
        icon={ClipboardCheck}
        size="lg"
      >
        {detail ? (
          <div className="space-y-5">
            {error ? (
              <p
                role="alert"
                className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700"
              >
                {error}
              </p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                <p className="text-xs text-slate-500">Solde calculé</p>
                <b>{formatAr(detail.calculatedClosingBalance)}</b>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                <p className="text-xs text-slate-500">Solde relevé</p>
                <b>{formatAr(detail.statementClosingBalance)}</b>
              </div>
              <div
                className={`rounded-xl p-3 ${detail.difference === 0 ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}
              >
                <p className="text-xs">Écart</p>
                <b>{formatAr(detail.difference)}</b>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Solde calculé = solde initial du relevé + mouvements du compte
              Banque sur la période. Chaque ligne doit être vérifiée avec le
              relevé avant de la pointer.
            </p>
            <div className="max-h-[45vh] overflow-auto rounded-xl border border-slate-100 dark:border-slate-800">
              {detail.transactions.length ? (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {detail.transactions.map((transaction) => {
                    const matched = transaction.reconciliationId === detail.id;
                    const signed = signedAmount(transaction);
                    return (
                      <li
                        key={transaction.id}
                        className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">
                            {transaction.label}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {dateLabel(transaction.transactionDate)} ·{" "}
                            {transaction.category}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-3 sm:justify-end">
                          <b
                            className={
                              signed < 0 ? "text-rose-600" : "text-emerald-600"
                            }
                          >
                            {signed < 0 ? "−" : "+"}
                            {formatAr(Math.abs(signed))}
                          </b>
                          {detail.status === "OPEN" ? (
                            <SecondaryButton
                              disabled={saving}
                              icon={matched ? X : Check}
                              onClick={() =>
                                void setMatched(transaction.id, !matched)
                              }
                            >
                              {matched ? "Retirer" : "Pointer"}
                            </SecondaryButton>
                          ) : (
                            <span className="text-xs font-bold text-emerald-700">
                              {matched ? "Pointé" : "Non pointé"}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="p-6 text-center text-sm text-slate-500">
                  Aucun mouvement Banque sur cette période.
                </p>
              )}
            </div>
            {detail.status === "OPEN" ? (
              <ModalFooter>
                {detail.matchedCount === 0 ? (
                  <SecondaryButton
                    disabled={saving}
                    icon={RotateCcw}
                    onClick={() => void cancelSession()}
                  >
                    Annuler la période
                  </SecondaryButton>
                ) : null}
                <PrimaryButton
                  disabled={
                    saving ||
                    detail.matchedCount !== detail.transactionCount ||
                    detail.difference !== 0
                  }
                  onClick={() => void completeSession()}
                >
                  {saving ? "Vérification…" : "Clôturer le rapprochement"}
                </PrimaryButton>
              </ModalFooter>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
