import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Plus,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { OrderFormModal } from "@/components/erp/OrderFormModal";
import { StatusBadge } from "@/components/erp/StatusBadge";
import {
  MetricCard,
  PageHeader,
  PrimaryButton,
  SectionHeading,
} from "@/components/erp/Ui";
import { useAuth } from "@/hooks/useAuth";
import { ApiError, readAuthSession } from "@/lib/auth";
import {
  dashboardApi,
  type DashboardData,
  type DashboardPeriod,
} from "@/lib/dashboard";
import { ordersApi, type CreateOrderInput } from "@/lib/orders";
import { formatAr, shortAr } from "@/utils/format";

const tooltipStyle = {
  borderRadius: "12px",
  border: "1px solid #f1f5f9",
  boxShadow: "0 10px 30px -15px rgba(15,23,42,.25)",
  fontSize: "12px",
};
const categoryColors = [
  "#ff226d",
  "#4f8df7",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#06b6d4",
  "#64748b",
];

function dateLabel(value: string | null): string {
  if (!value) return "sans échéance";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value.slice(0, 10) + "T00:00:00"));
}

function periodLabel(period: DashboardPeriod): string {
  if (period === "year") return "cette année";
  if (period === "quarter") return "ce trimestre";
  return "ce mois";
}

export default function Dashboard() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<DashboardPeriod>("month");
  const [summary, setSummary] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<string | null>(null);
  const canCreateOrder = Boolean(
    user?.roles.some((role) => role === "ADMIN" || role === "COMMERCIAL"),
  );

  const loadDashboard = useCallback(async () => {
    const session = readAuthSession();
    if (!session) {
      setError("Votre session a expiré. Reconnectez-vous.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setSummary(null);
    try {
      setSummary(
        await dashboardApi.summary(session.tokens.accessToken, period),
      );
      setError(null);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Le tableau de bord n’a pas pu être chargé.",
      );
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const createOrder = async (input: CreateOrderInput) => {
    const session = readAuthSession();
    if (!session) {
      throw new ApiError("Votre session a expiré. Reconnectez-vous.", 401);
    }
    const created = await ordersApi.create(session.tokens.accessToken, input);
    setCreatedOrder(created.orderNumber);
    await loadDashboard();
  };

  const categoryTotal =
    summary?.categorySales.reduce(
      (total, category) => total + category.total,
      0,
    ) ?? 0;
  const chartCategories =
    summary?.categorySales.map((category, index) => ({
      ...category,
      value: categoryTotal > 0 ? (category.total / categoryTotal) * 100 : 0,
      color: categoryColors[index % categoryColors.length],
    })) ?? [];
  const completionPercent =
    summary && summary.production.totalCount > 0
      ? Math.round(
          (summary.production.completedCount / summary.production.totalCount) *
            100,
        )
      : 0;

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        eyebrow={new Intl.DateTimeFormat("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date())}
        title={"Bonjour, " + (user?.firstName ?? "bienvenue") + " 👋"}
        description="Voici l’activité enregistrée dans votre organisation."
        action={
          <div className="flex flex-wrap gap-2 sm:flex-nowrap">
            <select
              value={period}
              onChange={(event) =>
                setPeriod(event.target.value as DashboardPeriod)
              }
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              aria-label="Période des indicateurs"
            >
              <option value="month">Ce mois</option>
              <option value="quarter">Ce trimestre</option>
              <option value="year">Cette année</option>
            </select>
            {canCreateOrder ? (
              <PrimaryButton
                icon={Plus}
                onClick={() => {
                  setCreatedOrder(null);
                  setIsOrderFormOpen(true);
                }}
              >
                Nouvelle commande
              </PrimaryButton>
            ) : null}
          </div>
        }
      />

      {createdOrder ? (
        <p
          role="status"
          className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          La commande {createdOrder} a été créée.
        </p>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700 dark:bg-rose-950/30 dark:text-rose-200"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="rounded-lg px-3 py-1.5 font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40"
          >
            Réessayer
          </button>
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {summary?.finance ? (
          <>
            <MetricCard
              label="Revenus encaissés"
              value={formatAr(summary.finance.income)}
              icon={Banknote}
              tone="pink"
              detail={periodLabel(period)}
            />
            <MetricCard
              label="Résultat estimé"
              value={formatAr(summary.finance.netResult)}
              icon={ArrowUpRight}
              tone="green"
              detail="revenus encaissés moins dépenses"
            />
            <MetricCard
              label="Dépenses"
              value={formatAr(summary.finance.expenses)}
              icon={Wallet}
              tone="amber"
              detail={periodLabel(period)}
            />
          </>
        ) : null}
        <MetricCard
          label="Commandes en cours"
          value={loading ? "…" : String(summary?.activeOrderCount ?? 0)}
          icon={ClipboardList}
          tone="blue"
          detail={(summary?.dueTodayCount ?? 0) + " échéance(s) aujourd’hui"}
        />
        <MetricCard
          label="Stock critique"
          value={loading ? "…" : String(summary?.criticalStockCount ?? 0)}
          icon={AlertTriangle}
          tone="violet"
          detail="articles au-dessous du seuil minimum"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-12">
        {summary?.finance ? (
          <div className="surface-card min-h-[340px] p-5 xl:col-span-8">
            <SectionHeading
              title="Évolution financière"
              description="Revenus encaissés et dépenses — six derniers mois"
              action={
                <div className="flex gap-3 text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-[#ff226d]">
                    <i className="h-2 w-2 rounded-full bg-[#ff226d]" />
                    Revenus
                  </span>
                  <span className="flex items-center gap-1.5 text-[#4f8df7]">
                    <i className="h-2 w-2 rounded-full bg-[#4f8df7]" />
                    Dépenses
                  </span>
                </div>
              }
            />
            <div className="mt-4 h-[265px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={summary.finance.monthly}
                  margin={{ left: -18, right: 8, top: 10 }}
                >
                  <defs>
                    <linearGradient
                      id="dashboardRevenue"
                      x1="0"
                      x2="0"
                      y1="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#ff226d"
                        stopOpacity={0.22}
                      />
                      <stop offset="100%" stopColor="#ff226d" stopOpacity={0} />
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
                    contentStyle={tooltipStyle}
                  />
                  <Area
                    dataKey="income"
                    type="monotone"
                    stroke="#ff226d"
                    strokeWidth={2.5}
                    fill="url(#dashboardRevenue)"
                    name="Revenus"
                  />
                  <Line
                    dataKey="expenses"
                    type="monotone"
                    stroke="#4f8df7"
                    strokeWidth={2.5}
                    dot={false}
                    name="Dépenses"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="surface-card flex min-h-[340px] items-center justify-center p-5 text-center text-sm text-slate-500 xl:col-span-8">
            {summary
              ? "Les indicateurs Finance sont réservés aux rôles comptables."
              : loading
                ? "Chargement des indicateurs…"
                : "Aucune donnée financière disponible."}
          </div>
        )}

        <div className="surface-card p-5 xl:col-span-4">
          <SectionHeading
            title="Ventes par catégorie"
            description={"Commandes enregistrées " + periodLabel(period)}
          />
          {chartCategories.length ? (
            <>
              <div className="relative mt-2 h-[225px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartCategories}
                      dataKey="value"
                      innerRadius={58}
                      outerRadius={84}
                      paddingAngle={5}
                      stroke="none"
                    >
                      {chartCategories.map((entry) => (
                        <Cell key={entry.category} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => value.toFixed(1) + "%"}
                      contentStyle={tooltipStyle}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <b className="text-xl">{shortAr(categoryTotal)}</b>
                  <span className="text-[10px] text-slate-400">ventes</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {chartCategories.map((entry) => (
                  <div
                    key={entry.category}
                    className="flex items-center gap-2 text-xs"
                  >
                    <i
                      style={{ backgroundColor: entry.color }}
                      className="h-2 w-2 rounded-full"
                    />
                    <span className="text-slate-500">{entry.category}</span>
                    <b className="ml-auto">{entry.value.toFixed(0)}%</b>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="py-16 text-center text-sm text-slate-500">
              {loading ? "Chargement…" : "Aucune commande sur cette période."}
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-12">
        <div className="surface-card overflow-hidden xl:col-span-7">
          <div className="p-5 pb-2">
            <SectionHeading
              title="Commandes récentes"
              description="Dernières commandes enregistrées"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left">
              <thead>
                <tr className="border-y border-slate-100 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3 font-bold">Commande</th>
                  <th className="px-3 py-3 font-bold">Client</th>
                  <th className="px-3 py-3 font-bold">Montant</th>
                  <th className="px-3 py-3 font-bold">Statut</th>
                </tr>
              </thead>
              <tbody>
                {summary?.recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-slate-50 text-xs last:border-0 dark:border-slate-800"
                  >
                    <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-100">
                      {order.orderNumber}
                    </td>
                    <td className="px-3 py-3.5 text-slate-500">
                      {order.clientName}
                    </td>
                    <td className="px-3 py-3.5 font-semibold">
                      {formatAr(order.total)}
                    </td>
                    <td className="px-3 py-3.5">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && !summary?.recentOrders.length ? (
              <p className="p-5 text-center text-sm text-slate-500">
                Aucune commande enregistrée.
              </p>
            ) : null}
          </div>
        </div>

        <div className="surface-card p-5 xl:col-span-5">
          <SectionHeading
            title="Production"
            description="Répartition des tâches par étape"
          />
          <div className="mt-4 h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={summary?.production.stages ?? []}
                margin={{ left: -25, right: 2 }}
              >
                <XAxis
                  dataKey="stage"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickFormatter={(stage: string) =>
                    stage === "Contrôle qualité" ? "Qualité" : stage
                  }
                />
                <YAxis hide allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar
                  dataKey="count"
                  name="Tâches"
                  fill="#ff226d"
                  radius={[5, 5, 0, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center justify-between rounded-xl bg-rose-50 px-3 py-2.5 text-xs dark:bg-rose-950/30">
            <span className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="h-4 w-4 text-[#ff226d]" />
              {summary?.production.completedCount ?? 0} tâches finalisées
            </span>
            <span className="font-extrabold text-[#ff226d]">
              {completionPercent}%
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="surface-card p-5">
          <SectionHeading
            title="À surveiller"
            description="Commandes urgentes ou bloquées"
          />
          <div className="mt-3 space-y-2">
            {summary?.urgentOrBlockedOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold">
                    {order.orderNumber} · {order.clientName}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">
                    {order.productName} · échéance {dateLabel(order.dueDate)}
                  </p>
                </div>
                <StatusBadge
                  status={
                    order.status === "Bloqué" ? order.status : order.priority
                  }
                />
              </div>
            ))}
            {!loading && !summary?.urgentOrBlockedOrders.length ? (
              <p className="py-6 text-center text-sm text-slate-500">
                Aucune commande urgente ou bloquée.
              </p>
            ) : null}
          </div>
        </div>

        <div className="surface-card p-5">
          <SectionHeading
            title="Alertes stock"
            description="Articles à réapprovisionner"
          />
          <div className="mt-3 space-y-2">
            {summary?.lowStockItems.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Boxes className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold">{item.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {item.quantity} {item.unit} disponibles · mini.{" "}
                    {item.minimumQuantity}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
            {!loading && !summary?.lowStockItems.length ? (
              <p className="py-6 text-center text-sm text-slate-500">
                Aucun article sous son seuil minimum.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <OrderFormModal
        open={isOrderFormOpen}
        onClose={() => setIsOrderFormOpen(false)}
        onSave={createOrder}
      />
    </div>
  );
}
