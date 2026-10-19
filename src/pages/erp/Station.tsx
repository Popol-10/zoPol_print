import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Clock3,
  Play,
  ShieldCheck,
} from "lucide-react";
import { ApiError, readAuthSession } from "@/lib/auth";
import { productionApi, type ProductionTaskRecord } from "@/lib/production";
import { MetricCard, PageHeader, SectionHeading } from "@/components/erp/Ui";
import { StatusBadge } from "@/components/erp/StatusBadge";

type Station = "dtf" | "laser" | "presse" | "qualite";
const stationLabels: Record<
  Station,
  { title: string; description: string; machine: string }
> = {
  dtf: {
    title: "Production DTF",
    description: "Ordres de fabrication enregistrés pour le poste DTF.",
    machine: "dtf",
  },
  laser: {
    title: "Laser CO₂",
    description: "Ordres de fabrication enregistrés pour le poste laser.",
    machine: "laser",
  },
  presse: {
    title: "Presse à chaud",
    description: "Ordres de fabrication enregistrés pour le poste de presse.",
    machine: "presse",
  },
  qualite: {
    title: "Contrôle qualité",
    description: "Commandes qui attendent leur contrôle qualité.",
    machine: "",
  },
};

function errorMessage(reason: unknown): string {
  return reason instanceof ApiError || reason instanceof Error
    ? reason.message
    : "Impossible de charger les tâches de production.";
}

export default function StationPage({ station }: { station: Station }) {
  const item = stationLabels[station];
  const [tasks, setTasks] = useState<ProductionTaskRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const session = readAuthSession();
      if (!session) {
        setError("Votre session a expiré. Reconnectez-vous.");
        setIsLoading(false);
        return;
      }
      try {
        const rows = await productionApi.tasks(session.tokens.accessToken);
        if (active) setTasks(rows);
      } catch (reason) {
        if (active) setError(errorMessage(reason));
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const entries = useMemo(
    () =>
      tasks.filter((task) =>
        station === "qualite"
          ? task.stage === "Contrôle qualité"
          : task.machine.toLocaleLowerCase().includes(item.machine),
      ),
    [tasks, station, item.machine],
  );
  const values = [
    {
      label: "À produire",
      stage: "À produire" as const,
      icon: Clock3,
      tone: "violet" as const,
    },
    {
      label: "En production",
      stage: "En production" as const,
      icon: Play,
      tone: "amber" as const,
    },
    {
      label: "Contrôle qualité",
      stage: "Contrôle qualité" as const,
      icon: ShieldCheck,
      tone: "blue" as const,
    },
    {
      label: "Terminées",
      stage: "Terminé" as const,
      icon: CheckCircle2,
      tone: "green" as const,
    },
  ];

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        eyebrow="Production · Poste"
        title={item.title}
        description={item.description}
      />
      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-200"
        >
          {error}
        </p>
      ) : null}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {values.map((metric) => (
          <MetricCard
            key={metric.stage}
            label={metric.label}
            value={`${entries.filter((task) => task.stage === metric.stage).length}`}
            icon={metric.icon}
            tone={metric.tone}
            detail="tâches de ce poste"
          />
        ))}
      </section>
      <div className="surface-card overflow-hidden">
        <div className="p-5">
          <SectionHeading
            title="Ordres en cours"
            description={
              station === "qualite"
                ? "Toutes les machines · contrôle qualité"
                : `Tâches de production · ${item.title}`
            }
            action={<span />}
          />
        </div>
        {isLoading ? (
          <p className="px-5 pb-5 text-sm text-slate-500">
            Chargement des ordres…
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-y border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 dark:border-slate-800">
                  <th className="px-5 py-3">Commande</th>
                  <th className="px-3 py-3">Produit</th>
                  <th className="px-3 py-3">Quantité</th>
                  <th className="px-3 py-3">Machine</th>
                  <th className="px-3 py-3">Opérateur</th>
                  <th className="px-5 py-3">Étape</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-slate-50 text-sm dark:border-slate-800"
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-extrabold">{entry.orderNumber}</p>
                      <p className="text-[11px] text-slate-500">
                        {entry.customer}
                      </p>
                    </td>
                    <td className="px-3 py-3.5 font-semibold">
                      {entry.product}
                    </td>
                    <td className="px-3 py-3.5">{entry.quantity}</td>
                    <td className="px-3 py-3.5 text-xs text-slate-500">
                      {entry.machine}
                    </td>
                    <td className="px-3 py-3.5 text-xs text-slate-500">
                      {entry.operatorName}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={entry.stage} />
                    </td>
                  </tr>
                ))}
                {!entries.length ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-8 text-center text-sm text-slate-500"
                    >
                      Aucun ordre enregistré pour ce poste.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
        <Activity className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Les relevés de consommation, temps machine et taux de rejet seront
          disponibles avec l’intégration des machines et des matières
          consommées.
        </p>
      </div>
    </div>
  );
}
