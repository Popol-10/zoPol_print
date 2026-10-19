import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, FileBarChart2, Medal, TrendingUp } from "lucide-react";
import { ActionModal } from "@/components/erp/ActionModal";
import {
  MetricCard,
  PageHeader,
  PrimaryButton,
  SectionHeading,
} from "@/components/erp/Ui";
import { ApiError, readAuthSession } from "@/lib/auth";
import { downloadCsv, type CsvCell } from "@/lib/csvExport";
import {
  dashboardApi,
  type DashboardData,
  type DashboardPeriod,
} from "@/lib/dashboard";
import { currencyUnitLabel, formatAr, shortAr } from "@/utils/format";

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #f1f5f9",
  fontSize: 12,
};

const chartColors = [
  "#ff226d",
  "#4f8df7",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#06b6d4",
  "#64748b",
];

type ReportKey =
  "sales" | "production" | "stock" | "finance" | "people" | "profitability";
type ExportKey = ReportKey | "statistics" | "global";

const periodOptions: Array<{ value: DashboardPeriod; label: string }> = [
  { value: "month", label: "Ce mois" },
  { value: "quarter", label: "Ce trimestre" },
  { value: "year", label: "Cette année" },
];

const reportTitles: Record<ReportKey, string> = {
  sales: "Rapport ventes",
  production: "Rapport production",
  stock: "Rapport stock",
  finance: "Rapport financier",
  people: "Rapport personnel",
  profitability: "Rapport rentabilité estimée",
};

function token(): string {
  const session = readAuthSession();
  if (!session)
    throw new ApiError("Votre session a expiré. Reconnectez-vous.", 401);
  return session.tokens.accessToken;
}

function useDashboardSummary(period: DashboardPeriod) {
  const [summary, setSummary] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setSummary(null);
    try {
      setSummary(await dashboardApi.summary(token(), period));
      setError(null);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Les statistiques n’ont pas pu être chargées.",
      );
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { summary, loading, error, setError, reload };
}

function periodName(period: DashboardPeriod): string {
  return (
    periodOptions.find((option) => option.value === period)?.label ?? "Ce mois"
  );
}

function selectedPeriod(value: string): DashboardPeriod {
  return (
    periodOptions.find((option) => option.label === value)?.value ?? "month"
  );
}

function createRows(data: DashboardData, key: ExportKey): CsvCell[][] {
  const rows: CsvCell[][] = [
    [
      "Rapport",
      key === "global"
        ? "Rapport global"
        : key === "statistics"
          ? "Statistiques"
          : reportTitles[key],
    ],
    ["Période", data.periodStart + " — " + data.periodEnd],
    [],
  ];
  const includeAll = key === "global" || key === "statistics";

  if (includeAll || key === "sales") {
    rows.push(
      ["Ventes et commandes"],
      ["Nombre de commandes", data.sales.orderCount],
      [`Total des commandes (${currencyUnitLabel()})`, data.sales.totalSales],
      [`Marge estimée (${currencyUnitLabel()})`, data.sales.estimatedMargin],
      ["Marge estimée (%)", data.sales.marginPercent],
      [],
      ["Ventes par catégorie"],
      [
        "Catégorie",
        `Total (${currencyUnitLabel()})`,
        `Marge estimée (${currencyUnitLabel()})`,
        "Marge estimée (%)",
      ],
      ...data.categorySales.map((item) => [
        item.category,
        item.total,
        item.estimatedMargin,
        item.marginPercent,
      ]),
      [],
    );
  }

  if (includeAll || key === "production") {
    rows.push(
      ["Production"],
      ["Étape", "Nombre de tâches"],
      ...data.production.stages.map((item) => [item.stage, item.count]),
      [],
    );
  }

  if (includeAll || key === "stock") {
    rows.push(
      ["Stock"],
      ["Références actives", data.stock.itemCount],
      [
        `Valeur au coût unitaire courant (${currencyUnitLabel()})`,
        data.stock.inventoryValue,
      ],
      ["Références sous le seuil", data.criticalStockCount],
      [],
      ["Alertes de stock"],
      ["Article", "Quantité", "Seuil minimum", "Unité", "État"],
      ...data.lowStockItems.map((item) => [
        item.name,
        item.quantity,
        item.minimumQuantity,
        item.unit,
        item.status,
      ]),
      [],
    );
  }

  if (key === "finance" && !data.finance) {
    throw new Error(
      "Le rapport Finance est réservé aux rôles ADMIN et ACCOUNTANT.",
    );
  }
  if (data.finance && (key === "global" || key === "finance")) {
    rows.push(
      ["Finance"],
      [
        `Revenus encaissés sur la période (${currencyUnitLabel()})`,
        data.finance.income,
      ],
      [
        `Dépenses sur la période (${currencyUnitLabel()})`,
        data.finance.expenses,
      ],
      [`Résultat net estimé (${currencyUnitLabel()})`, data.finance.netResult],
      [],
      ["Évolution mensuelle"],
      [
        "Mois",
        `Revenus (${currencyUnitLabel()})`,
        `Dépenses (${currencyUnitLabel()})`,
      ],
      ...data.finance.monthly.map((item) => [
        item.month,
        item.income,
        item.expenses,
      ]),
      [],
    );
  }

  if (key === "people" && !data.people) {
    throw new Error(
      "Le rapport personnel est réservé aux rôles ADMIN et HR_MANAGER.",
    );
  }
  if (data.people && (key === "global" || key === "people")) {
    rows.push(
      ["Personnel"],
      ["Employés actifs", data.people.activeEmployeeCount],
      ["Pointages enregistrés aujourd’hui", data.people.recordedTodayCount],
      ["Présents ou en retard", data.people.presentTodayCount],
      ["Taux de présence parmi les pointages (%)", data.people.attendanceRate],
      [],
    );
  }

  if (includeAll || key === "profitability") {
    rows.push(
      ["Rentabilité estimée par produit"],
      [
        "Produit",
        "Catégorie",
        "Commandes",
        "Quantité vendue",
        `Ventes (${currencyUnitLabel()})`,
        `Prix moyen courant (${currencyUnitLabel()})`,
        `Coût unitaire courant (${currencyUnitLabel()})`,
        `Marge estimée (${currencyUnitLabel()})`,
        `Marge estimée par unité (${currencyUnitLabel()})`,
        "Marge estimée (%)",
      ],
      ...data.productPerformance.map((item) => [
        item.productName,
        item.category,
        item.orderCount,
        item.quantitySold,
        item.salesTotal,
        item.averageUnitPrice,
        item.currentUnitCost,
        item.estimatedMargin,
        item.marginPerUnit,
        item.marginPercent,
      ]),
    );
  }

  return rows;
}

async function exportReport(
  key: ExportKey,
  period: DashboardPeriod,
): Promise<void> {
  const data = await dashboardApi.summary(token(), period);
  const periodPart =
    period === "year" ? "annee" : period === "quarter" ? "trimestre" : "mois";
  const filenamePart = key;
  downloadCsv(
    "makart-" + filenamePart + "-" + periodPart + ".csv",
    createRows(data, key),
  );
}

function metricForReport(
  key: ReportKey,
  data: DashboardData | null,
  loading: boolean,
): string {
  if (!data) return loading ? "Chargement…" : "—";
  switch (key) {
    case "sales":
      return formatAr(data.sales.totalSales);
    case "production":
      return (
        data.production.completedCount +
        " / " +
        data.production.totalCount +
        " tâches"
      );
    case "stock":
      return formatAr(data.stock.inventoryValue);
    case "finance":
      return data.finance ? formatAr(data.finance.netResult) : "Accès réservé";
    case "people":
      return data.people
        ? data.people.activeEmployeeCount + " employés actifs"
        : "Accès réservé";
    case "profitability":
      return data.sales.marginPercent.toFixed(1) + " % estimée";
  }
  return "—";
}

export function Statistics() {
  const [period, setPeriod] = useState<DashboardPeriod>("month");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [exporting, setExporting] = useState(false);
  const { summary, loading, error, setError, reload } =
    useDashboardSummary(period);

  const categoryTotal =
    summary?.categorySales.reduce((total, item) => total + item.total, 0) ?? 0;
  const categories = useMemo(
    () =>
      (summary?.categorySales ?? []).map((item, index) => ({
        ...item,
        share: categoryTotal > 0 ? (item.total / categoryTotal) * 100 : 0,
        color: chartColors[index % chartColors.length],
      })),
    [summary, categoryTotal],
  );
  const productionRate =
    summary && summary.production.totalCount > 0
      ? (summary.production.completedCount / summary.production.totalCount) *
        100
      : 0;

  const exportStatistics = async (values: Record<string, string>) => {
    const exportPeriod = selectedPeriod(values.period ?? periodName(period));
    setExporting(true);
    setError(null);
    try {
      await exportReport("statistics", exportPeriod);
      setNotice("Le CSV des statistiques a été téléchargé.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "L’export a échoué.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        eyebrow="Performance"
        title="Statistiques avancées"
        description="Ventes, marges estimées, production et stock issus des données enregistrées."
        action={
          <div className="flex flex-wrap gap-2 sm:flex-nowrap">
            <select
              value={period}
              onChange={(event) =>
                setPeriod(event.target.value as DashboardPeriod)
              }
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold dark:border-slate-700 dark:bg-slate-900"
              aria-label="Période des statistiques"
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <PrimaryButton
              icon={Download}
              disabled={exporting}
              onClick={() => setIsExportModalOpen(true)}
            >
              {exporting ? "Export…" : "Exporter CSV"}
            </PrimaryButton>
          </div>
        }
      />

      {error ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700"
        >
          <span>{error}</span>
          <button type="button" onClick={() => void reload()}>
            Réessayer
          </button>
        </div>
      ) : null}
      {notice ? (
        <div
          role="status"
          className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"
        >
          {notice}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label="CA commandes"
          value={
            summary ? formatAr(summary.sales.totalSales) : loading ? "…" : "—"
          }
          icon={TrendingUp}
          tone="pink"
          detail={periodName(period)}
        />
        <MetricCard
          label="Marge estimée"
          value={
            summary
              ? formatAr(summary.sales.estimatedMargin)
              : loading
                ? "…"
                : "—"
          }
          icon={Medal}
          tone="green"
          detail="hors frais fixes"
        />
        <MetricCard
          label="Taux de marge estimé"
          value={
            summary
              ? summary.sales.marginPercent.toFixed(1) + " %"
              : loading
                ? "…"
                : "—"
          }
          icon={TrendingUp}
          tone="blue"
          detail="calculée avec les coûts unitaires actuels"
        />
        <MetricCard
          label="Commandes"
          value={
            summary ? String(summary.sales.orderCount) : loading ? "…" : "—"
          }
          icon={FileBarChart2}
          tone="violet"
          detail={periodName(period)}
        />
        <MetricCard
          label="Production terminée"
          value={
            summary ? productionRate.toFixed(0) + " %" : loading ? "…" : "—"
          }
          icon={Medal}
          tone="amber"
          detail={
            summary
              ? summary.production.completedCount +
                " / " +
                summary.production.totalCount +
                " tâches"
              : "sur les commandes de la période"
          }
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="surface-card p-5">
          <SectionHeading
            title="Produits les plus vendus"
            description="Quantités commandées sur la période"
          />
          {summary?.productPerformance.length ? (
            <div className="mt-4 h-[270px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={summary.productPerformance.slice(0, 5)}
                  margin={{ left: 10, right: 16 }}
                >
                  <CartesianGrid horizontal={false} stroke="#eef1f6" />
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis
                    width={135}
                    type="category"
                    dataKey="productName"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <Tooltip
                    formatter={(value: number) => value + " unités"}
                    contentStyle={tooltipStyle}
                  />
                  <Bar
                    dataKey="quantitySold"
                    name="Quantité"
                    fill="#ff226d"
                    radius={[0, 5, 5, 0]}
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-20 text-center text-sm text-slate-500">
              {loading ? "Chargement…" : "Aucune commande sur cette période."}
            </p>
          )}
        </div>

        <div className="surface-card p-5">
          <SectionHeading
            title="Ventes par catégorie"
            description="Part du montant des commandes"
          />
          {categories.length ? (
            <div className="flex h-[270px] items-center">
              <div className="h-full w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categories}
                      dataKey="share"
                      innerRadius={48}
                      outerRadius={76}
                      paddingAngle={5}
                      stroke="none"
                    >
                      {categories.map((item) => (
                        <Cell key={item.category} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => value.toFixed(1) + " %"}
                      contentStyle={tooltipStyle}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-3">
                {categories.map((item) => (
                  <div
                    key={item.category}
                    className="flex items-center gap-2 text-xs"
                  >
                    <i
                      style={{ backgroundColor: item.color }}
                      className="h-2.5 w-2.5 rounded-full"
                    />
                    <span className="flex-1 text-slate-500">
                      {item.category}
                    </span>
                    <b>{item.share.toFixed(1)} %</b>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="py-20 text-center text-sm text-slate-500">
              {loading ? "Chargement…" : "Aucune vente sur cette période."}
            </p>
          )}
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="p-5">
          <SectionHeading
            title="Marge estimée par produit"
            description="Les coûts unitaires sont ceux du catalogue actuel ; les frais fixes ne sont pas déduits."
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-y border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 dark:border-slate-800">
                <th className="px-5 py-3">Produit</th>
                <th className="px-3 py-3">Qté</th>
                <th className="px-3 py-3">Prix moyen</th>
                <th className="px-3 py-3">Coût courant</th>
                <th className="px-3 py-3">Marge / unité</th>
                <th className="px-5 py-3">Marge estimée</th>
              </tr>
            </thead>
            <tbody>
              {summary?.productPerformance.map((product) => (
                <tr
                  key={product.productId}
                  className="border-b border-slate-50 text-sm dark:border-slate-800"
                >
                  <td className="px-5 py-3.5 font-bold">
                    {product.productName}
                    <span className="ml-2 text-xs font-normal text-slate-400">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">{product.quantitySold}</td>
                  <td className="px-3 py-3.5">
                    {formatAr(product.averageUnitPrice)}
                  </td>
                  <td className="px-3 py-3.5 text-slate-500">
                    {formatAr(product.currentUnitCost)}
                  </td>
                  <td className="px-3 py-3.5 font-semibold">
                    {formatAr(product.marginPerUnit)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${
                        product.estimatedMargin < 0
                          ? "bg-rose-50 text-rose-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {formatAr(product.estimatedMargin)}
                      <span className="ml-1 opacity-70">
                        ({product.marginPercent.toFixed(1)} %)
                      </span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !summary?.productPerformance.length ? (
            <p className="p-5 text-center text-sm text-slate-500">
              Aucun produit vendu sur cette période.
            </p>
          ) : null}
        </div>
      </section>

      <p className="text-xs text-slate-500">
        Les marges sont des estimations avant frais fixes : elles soustraient le
        coût unitaire actuel du produit au montant de commande enregistré.
      </p>

      <ActionModal
        open={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Exporter les statistiques"
        description="Téléchargez les agrégats chargés depuis le backend au format CSV."
        submitLabel="Télécharger CSV"
        icon={Download}
        fields={[
          {
            name: "period",
            label: "Période",
            type: "select",
            options: periodOptions.map((option) => option.label),
            defaultValue: periodName(period),
          },
        ]}
        onSubmit={(values) => void exportStatistics(values)}
      />
    </div>
  );
}

export function Reports() {
  const [period, setPeriod] = useState<DashboardPeriod>("month");
  const [reportToGenerate, setReportToGenerate] = useState<ExportKey | null>(
    null,
  );
  const [notice, setNotice] = useState("");
  const [exporting, setExporting] = useState(false);
  const { summary, loading, error, setError, reload } =
    useDashboardSummary(period);

  const reports: Array<{
    key: ReportKey;
    title: string;
    description: string;
    category: string;
  }> = [
    {
      key: "sales",
      title: reportTitles.sales,
      description: "Montant des commandes et volumes par catégorie",
      category: "Commerce",
    },
    {
      key: "production",
      title: reportTitles.production,
      description: "Tâches enregistrées par étape de production",
      category: "Production",
    },
    {
      key: "stock",
      title: reportTitles.stock,
      description: "Valeur courante du stock et références à réapprovisionner",
      category: "Stock",
    },
    {
      key: "finance",
      title: reportTitles.finance,
      description: "Revenus, dépenses et résultat net de la période",
      category: "Finance",
    },
    {
      key: "people",
      title: reportTitles.people,
      description: "Effectif actif et présence du jour",
      category: "RH",
    },
    {
      key: "profitability",
      title: reportTitles.profitability,
      description: "Estimations par produit à partir des coûts actuels",
      category: "Analyse",
    },
  ];

  const canGenerate = (key: ReportKey) => {
    if (key === "finance") return Boolean(summary?.finance);
    if (key === "people") return Boolean(summary?.people);
    return true;
  };

  const exportSelectedReport = async (values: Record<string, string>) => {
    if (!reportToGenerate) return;
    const exportPeriod = selectedPeriod(values.period ?? periodName(period));
    setExporting(true);
    setError(null);
    try {
      await exportReport(reportToGenerate, exportPeriod);
      setNotice("Le rapport CSV a été téléchargé avec les données API.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "L’export a échoué.");
    } finally {
      setExporting(false);
    }
  };

  const openExport = (key: ExportKey) => {
    setNotice("");
    setReportToGenerate(key);
  };

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        eyebrow="Performance"
        title="Rapports"
        description="Préparez des exports CSV à partir des données ERP enregistrées."
        action={
          <div className="flex flex-wrap gap-2 sm:flex-nowrap">
            <select
              value={period}
              onChange={(event) =>
                setPeriod(event.target.value as DashboardPeriod)
              }
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold dark:border-slate-700 dark:bg-slate-900"
              aria-label="Période des rapports"
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <PrimaryButton
              icon={Download}
              disabled={exporting}
              onClick={() => openExport("global")}
            >
              Exporter le rapport global
            </PrimaryButton>
          </div>
        }
      />
      {error ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700"
        >
          <span>{error}</span>
          <button type="button" onClick={() => void reload()}>
            Réessayer
          </button>
        </div>
      ) : null}
      {notice ? (
        <div
          role="status"
          className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"
        >
          {notice}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => {
          const allowed = canGenerate(report.key);
          return (
            <article
              key={report.key}
              className="surface-card group p-5 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-[#ff226d]">
                  <FileBarChart2 className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500 dark:bg-slate-800">
                  {report.category}
                </span>
              </div>
              <h2 className="mt-5 font-extrabold">{report.title}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {report.description}
              </p>
              <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">
                    Indicateur clé · {periodName(period)}
                  </p>
                  <b className="mt-1 block text-lg">
                    {metricForReport(report.key, summary, loading)}
                  </b>
                </div>
                <button
                  disabled={!allowed || exporting}
                  onClick={() => openExport(report.key)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-[#e91f63] transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700"
                >
                  Générer CSV
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <ActionModal
        open={Boolean(reportToGenerate)}
        onClose={() => setReportToGenerate(null)}
        title={
          reportToGenerate === "global"
            ? "Rapport global"
            : reportToGenerate === "statistics"
              ? "Statistiques avancées"
              : reportToGenerate
                ? reportTitles[reportToGenerate]
                : "Rapport"
        }
        description="L’export CSV est construit depuis les données renvoyées par l’API."
        submitLabel="Télécharger CSV"
        icon={FileBarChart2}
        fields={[
          {
            name: "period",
            label: "Période",
            type: "select",
            options: periodOptions.map((option) => option.label),
            defaultValue: periodName(period),
          },
        ]}
        onSubmit={(values) => void exportSelectedReport(values)}
      />
    </div>
  );
}
