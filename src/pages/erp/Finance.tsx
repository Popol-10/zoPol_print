import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowLeftRight,
  ArrowUpRight,
  Landmark,
  Plus,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  MetricCard,
  PageHeader,
  PrimaryButton,
  SearchInput,
  SecondaryButton,
} from "@/components/erp/Ui";
import { ApiError, readAuthSession } from "@/lib/auth";
import {
  financeApi,
  type FinanceSummary,
  type FinanceTransactionInput,
  type FinanceTransferInput,
  type FinanceTransactionRecord,
  type FinanceTransactionType,
} from "@/lib/finance";
import { formatAr, shortAr } from "@/utils/format";
import { TransactionFormModal } from "@/components/erp/TransactionFormModal";
import { FinanceTransferModal } from "@/components/erp/FinanceTransferModal";
import { BankReconciliationManager } from "@/components/erp/BankReconciliationManager";

type FinanceMode =
  "dashboard" | "caisse" | "banque" | "revenus" | "depenses" | "charges";

const emptySummary: FinanceSummary = {
  totalIncome: 0,
  totalExpenses: 0,
  totalBalance: 0,
  cashBalance: 0,
  bankBalance: 0,
  mobileMoneyBalance: 0,
  monthly: [],
};

const categoryLabels: Record<FinanceTransactionRecord["category"], string> = {
  SALES: "Vente",
  CLIENT_DEPOSIT: "Acompte client",
  OTHER_INCOME: "Autre revenu",
  GENERAL_EXPENSE: "Frais généraux",
  INTERNAL_PURCHASE: "Achats internes",
  LOGISTICS: "Logistique",
  MAINTENANCE: "Maintenance",
  OTHER_EXPENSE: "Autre dépense",
  OPENING_BALANCE: "Solde initial",
  ACCOUNT_TRANSFER: "Transfert entre comptes",
};

const methodLabels: Record<FinanceTransactionRecord["method"], string> = {
  CASH: "Caisse",
  BANK: "Banque",
  MOBILE_MONEY: "Mobile Money",
};

function accessToken(): string {
  const session = readAuthSession();
  if (!session) {
    throw new ApiError("Votre session a expiré. Reconnectez-vous.", 401);
  }
  return session.tokens.accessToken;
}

function transactionDateLabel(value: string): string {
  const date = new Date(value.slice(0, 10) + "T00:00:00");
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function transactionFilters(mode: FinanceMode) {
  if (mode === "caisse") return { method: "CASH" as const };
  if (mode === "banque") return { method: "BANK" as const };
  if (mode === "revenus") return { type: "INCOME" as const };
  if (mode === "depenses" || mode === "charges") {
    return { type: "EXPENSE" as const };
  }
  return {};
}

export default function Finance({
  mode = "dashboard",
}: {
  mode?: FinanceMode;
}) {
  const [summary, setSummary] = useState<FinanceSummary>(emptySummary);
  const [transactions, setTransactions] = useState<FinanceTransactionRecord[]>(
    [],
  );
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [initialType, setInitialType] =
    useState<FinanceTransactionType>("INCOME");
  const [error, setError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const title: Record<FinanceMode, string> = {
    dashboard: "Dashboard financier",
    caisse: "Caisse",
    banque: "Banque",
    revenus: "Revenus",
    depenses: "Dépenses",
    charges: "Charges",
  };
  const subtitle: Record<FinanceMode, string> = {
    dashboard: "Consultez les soldes et les mouvements enregistrés.",
    caisse: "Suivez les entrées et sorties enregistrées en caisse.",
    banque: "Consultez les opérations enregistrées sur le compte bancaire.",
    revenus: "Consultez les revenus du registre financier.",
    depenses: "Consultez les dépenses du registre financier.",
    charges: "Consultez les charges enregistrées.",
  };

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await financeApi.summary(accessToken()));
      setSummaryError(null);
    } catch (reason) {
      setSummaryError(
        reason instanceof Error
          ? reason.message
          : "Le résumé financier n’a pas pu être chargé.",
      );
    }
  }, []);

  const loadTransactions = useCallback(
    async (requestedPage = 1, append = false) => {
      setIsLoading(true);
      setError(null);
      try {
        const pageSize = mode === "dashboard" ? 6 : 15;
        const result = await financeApi.transactions(accessToken(), {
          ...transactionFilters(mode),
          page: requestedPage,
          pageSize,
          search: query,
        });
        setTransactions((current) =>
          append ? [...current, ...result.items] : result.items,
        );
        setTotalTransactions(result.total);
        setPage(result.page);
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : "Les opérations n’ont pas pu être chargées.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [mode, query],
  );

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTransactions(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [loadTransactions]);

  const refresh = async () => {
    await Promise.all([loadSummary(), loadTransactions(1)]);
  };

  const openTransactionModal = (type: FinanceTransactionType) => {
    setInitialType(type);
    setIsTransactionModalOpen(true);
  };

  const saveTransaction = async (input: FinanceTransactionInput) => {
    setIsSaving(true);
    setError(null);
    try {
      await financeApi.createTransaction(accessToken(), input);
      setNotice("L’opération a été enregistrée.");
      setIsTransactionModalOpen(false);
      await Promise.all([loadSummary(), loadTransactions(1)]);
    } catch (reason) {
      const message =
        reason instanceof Error
          ? reason.message
          : "L’opération n’a pas été enregistrée.";
      setError(message);
      throw reason;
    } finally {
      setIsSaving(false);
    }
  };

  const saveTransfer = async (input: FinanceTransferInput) => {
    setIsSaving(true);
    setError(null);
    try {
      await financeApi.createTransfer(accessToken(), input);
      setNotice("Le virement a été enregistré sur les deux comptes.");
      setIsTransferModalOpen(false);
      await Promise.all([loadSummary(), loadTransactions(1)]);
    } catch (reason) {
      const message =
        reason instanceof Error
          ? reason.message
          : "Le virement n’a pas été enregistré.";
      setError(message);
      throw reason;
    } finally {
      setIsSaving(false);
    }
  };

  const displayedBalance =
    mode === "caisse"
      ? summary.cashBalance
      : mode === "banque"
        ? summary.bankBalance
        : summary.totalBalance;
  const balanceLabel =
    mode === "caisse"
      ? "Solde caisse"
      : mode === "banque"
        ? "Solde banque"
        : "Solde global";

  const metrics = [
    {
      label: balanceLabel,
      value: formatAr(displayedBalance),
      icon: mode === "banque" ? Landmark : Wallet,
      tone: "pink" as const,
      detail: "selon les opérations enregistrées",
    },
    {
      label: "Revenus",
      value: formatAr(summary.totalIncome),
      icon: ArrowUpRight,
      tone: "green" as const,
      detail: "total du registre",
    },
    {
      label: "Dépenses",
      value: formatAr(summary.totalExpenses),
      icon: ArrowDownRight,
      tone: "amber" as const,
      detail: "total du registre",
    },
    {
      label: "Mobile Money",
      value: formatAr(summary.mobileMoneyBalance),
      icon: Landmark,
      tone: "blue" as const,
      detail: "solde enregistré",
    },
  ];

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        eyebrow="Finance"
        title={title[mode]}
        description={subtitle[mode]}
        action={
          mode === "caisse" || mode === "banque" ? (
            <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-nowrap">
              <SecondaryButton
                className="flex-1 sm:flex-none"
                icon={ArrowLeftRight}
                onClick={() => setIsTransferModalOpen(true)}
                disabled={isSaving}
              >
                Transfert
              </SecondaryButton>
              <SecondaryButton
                className="flex-1 sm:flex-none"
                icon={ArrowDownRight}
                onClick={() => openTransactionModal("EXPENSE")}
              >
                Sortie
              </SecondaryButton>
              <PrimaryButton
                className="flex-1 sm:flex-none"
                icon={ArrowUpRight}
                onClick={() => openTransactionModal("INCOME")}
              >
                Entrée
              </PrimaryButton>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 sm:flex-nowrap">
              <SecondaryButton
                icon={ArrowLeftRight}
                onClick={() => setIsTransferModalOpen(true)}
                disabled={isSaving}
              >
                Transfert
              </SecondaryButton>
              <PrimaryButton
                icon={Plus}
                onClick={() => openTransactionModal("INCOME")}
                disabled={isSaving}
              >
                Nouvelle opération
              </PrimaryButton>
            </div>
          )
        }
      />
      {mode === "banque" ? <BankReconciliationManager /> : null}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>
      {(error || summaryError || notice) && (
        <div
          role={error || summaryError ? "alert" : "status"}
          className={
            "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-bold " +
            (error || summaryError
              ? "border-rose-100 bg-rose-50 text-rose-700"
              : "border-emerald-100 bg-emerald-50 text-emerald-700")
          }
        >
          <span>{error ?? summaryError ?? notice}</span>
          {error || summaryError ? (
            <SecondaryButton
              onClick={() => void refresh()}
              disabled={isLoading}
            >
              Réessayer
            </SecondaryButton>
          ) : (
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Fermer"
            >
              ×
            </button>
          )}
        </div>
      )}
      {mode === "dashboard" && (
        <section className="surface-card p-5">
          <div>
            <h2 className="font-extrabold">Revenus et dépenses</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Opérations des six derniers mois
            </p>
          </div>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={summary.monthly}
                margin={{ top: 10, left: -18, right: 8 }}
              >
                <defs>
                  <linearGradient
                    id="financeRevenue"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop offset="0" stopColor="#ff226d" stopOpacity={0.22} />
                    <stop offset="1" stopColor="#ff226d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#eef1f6" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={shortAr}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />
                <Tooltip
                  formatter={(value: number) => formatAr(value)}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #f1f5f9",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#ff226d"
                  strokeWidth={2.5}
                  fill="url(#financeRevenue)"
                  name="Revenus"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#4f8df7"
                  strokeWidth={2.5}
                  fill="transparent"
                  name="Dépenses"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
      <section className="surface-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-extrabold">
              {mode === "dashboard" ? "Dernières opérations" : "Opérations"}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {isLoading
                ? "Chargement…"
                : transactions.length +
                  " sur " +
                  totalTransactions +
                  " opérations"}
            </p>
          </div>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Rechercher une opération..."
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 dark:border-slate-800">
                <th className="px-5 py-3">Libellé</th>
                <th className="px-3 py-3">Catégorie</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Compte</th>
                <th className="px-5 py-3 text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => {
                const isExpense = transaction.type === "EXPENSE";
                const isTransferOut = transaction.type === "TRANSFER_OUT";
                const isTransferIn = transaction.type === "TRANSFER_IN";
                const isTransfer = isTransferOut || isTransferIn;
                const isOpening = transaction.type === "OPENING_BALANCE";
                return (
                  <tr
                    key={transaction.id}
                    className="border-b border-slate-50 text-sm dark:border-slate-800"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span
                          className={
                            "flex h-8 w-8 items-center justify-center rounded-lg " +
                            (isTransfer
                              ? "bg-blue-50 text-blue-600"
                              : isExpense
                                ? "bg-rose-50 text-rose-600"
                                : "bg-emerald-50 text-emerald-600")
                          }
                        >
                          {isTransfer ? (
                            <ArrowLeftRight className="h-4 w-4" />
                          ) : isExpense ? (
                            <ArrowDownRight className="h-4 w-4" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4" />
                          )}
                        </span>
                        <p className="font-bold">{transaction.label}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-xs text-slate-500">
                      {categoryLabels[transaction.category]}
                    </td>
                    <td className="px-3 py-3.5 text-xs text-slate-500">
                      {transactionDateLabel(transaction.transactionDate)}
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {methodLabels[transaction.method]}
                      </span>
                    </td>
                    <td
                      className={
                        "px-5 py-3.5 text-right font-extrabold " +
                        (isTransfer
                          ? "text-blue-600"
                          : isExpense
                            ? "text-rose-600"
                            : "text-emerald-600")
                      }
                    >
                      {isExpense || isTransferOut ? "−" : "+"}
                      {formatAr(transaction.amount)}
                      {isOpening && (
                        <span className="ml-1 text-[10px] font-medium text-slate-400">
                          initial
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!isLoading && transactions.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    {query
                      ? "Aucune opération ne correspond à la recherche."
                      : "Aucune opération enregistrée pour le moment."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {transactions.length < totalTransactions && mode !== "dashboard" && (
          <div className="border-t border-slate-100 p-4 text-center dark:border-slate-800">
            <SecondaryButton
              onClick={() => void loadTransactions(page + 1, true)}
              disabled={isLoading}
            >
              {isLoading ? "Chargement…" : "Charger la suite"}
            </SecondaryButton>
          </div>
        )}
      </section>
      <FinanceTransferModal
        open={isTransferModalOpen}
        saving={isSaving}
        onClose={() => !isSaving && setIsTransferModalOpen(false)}
        onSave={saveTransfer}
      />
      <TransactionFormModal
        open={isTransactionModalOpen}
        onClose={() => !isSaving && setIsTransactionModalOpen(false)}
        initialType={initialType}
        onSave={saveTransaction}
      />
    </div>
  );
}
