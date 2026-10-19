import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Gauge,
  Plus,
  Users,
  Wrench,
} from "lucide-react";
import { employees } from "@/data/mockData";
import type { Employee } from "@/types/erp";
import { currencyUnitLabel, formatAr } from "@/utils/format";
import {
  MetricCard,
  PageHeader,
  PrimaryButton,
  SearchInput,
  SecondaryButton,
  SectionHeading,
} from "@/components/erp/Ui";
import { StatusBadge } from "@/components/erp/StatusBadge";
import { ActionModal } from "@/components/erp/ActionModal";
import { Modal, ModalFooter } from "@/components/erp/Modal";
import { useAuth } from "@/hooks/useAuth";
import { ApiError, readAuthSession } from "@/lib/auth";
import {
  machinesApi,
  type MachineRecord,
  type MachineStatus,
  type MaintenanceKind,
  type MaintenanceRecord,
  type MaintenanceStatus,
} from "@/lib/machines";
import { productionApi, type ProductionTaskRecord } from "@/lib/production";

export function People({
  mode = "employees",
}: {
  mode?: "employees" | "presences" | "tasks" | "remuneration";
}) {
  const { user } = useAuth();
  const canViewSalary =
    mode === "remuneration" &&
    Boolean(user?.roles.some((role) => ["ADMIN", "HR_MANAGER"].includes(role)));
  const [team, setTeam] = useState(employees);
  const [query, setQuery] = useState("");
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const filtered = useMemo(
    () =>
      team.filter((employee) =>
        `${employee.name} ${employee.role}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query, team],
  );
  const content = {
    employees: [
      "Employés",
      "Gérez les équipes, leurs tâches et leurs performances.",
    ],
    presences: [
      "Présences",
      "Suivez les arrivées et le temps de présence des équipes.",
    ],
    tasks: [
      "Tâches",
      "Répartissez et suivez la charge de travail quotidienne.",
    ],
    remuneration: [
      "Rémunération",
      "Visualisez la masse salariale et les échéances.",
    ],
  }[mode];
  return (
    <div className="page-enter space-y-6">
      <PageHeader
        eyebrow="Personnel"
        title={content[0]}
        description={content[1]}
        action={
          <PrimaryButton icon={Plus} onClick={() => setIsActionModalOpen(true)}>
            {mode === "tasks" ? "Nouvelle tâche" : "Ajouter un employé"}
          </PrimaryButton>
        }
      />
      <section
        className={`grid gap-3 sm:grid-cols-2 ${canViewSalary ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}
      >
        <MetricCard
          label="Employés"
          value="15"
          icon={Users}
          tone="pink"
          detail="effectif total"
        />
        <MetricCard
          label="Présents aujourd'hui"
          value="12"
          icon={CheckCircle2}
          tone="green"
          detail="80 % de l'effectif"
        />
        <MetricCard
          label="Absents"
          value="1"
          icon={Users}
          tone="violet"
          detail="congé validé"
        />
        <MetricCard
          label="Retards"
          value="2"
          icon={Clock3}
          tone="amber"
          detail="à régulariser"
        />
        {canViewSalary && (
          <MetricCard
            label="Masse salariale"
            value={formatAr(12200000)}
            icon={Activity}
            tone="blue"
            detail="prévision mensuelle"
          />
        )}
      </section>
      {notice && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          <span>{notice}</span>
          <button onClick={() => setNotice("")}>×</button>
        </div>
      )}
      <div className="surface-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
          <div>
            <h2 className="font-extrabold">
              {mode === "tasks"
                ? "Répartition des tâches"
                : "Équipe de l'atelier"}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Mise à jour aujourd'hui à 08h15
            </p>
          </div>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Rechercher un employé..."
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 dark:border-slate-800">
                <th className="px-5 py-3">Employé</th>
                <th className="px-3 py-3">Poste</th>
                <th className="px-3 py-3">Présence</th>
                <th className="px-3 py-3">Heures</th>
                <th className="px-3 py-3">Tâches</th>
                <th className="px-3 py-3">Performance</th>
                {canViewSalary && <th className="px-5 py-3">Salaire</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((employee) => (
                <tr
                  key={employee.id}
                  className="border-b border-slate-50 text-sm dark:border-slate-800"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-xs font-extrabold text-blue-600">
                        {employee.initials}
                      </span>
                      <p className="font-bold">{employee.name}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-xs text-slate-500">
                    {employee.role}
                  </td>
                  <td className="px-3 py-3.5">
                    <StatusBadge status={employee.presence} />
                  </td>
                  <td className="px-3 py-3.5 font-semibold">
                    {employee.hours}
                  </td>
                  <td className="px-3 py-3.5">
                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold dark:bg-slate-800">
                      {employee.tasks}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <i
                          style={{ width: `${employee.performance}%` }}
                          className="block h-full rounded-full bg-[#ff226d]"
                        />
                      </div>
                      <b className="text-xs">{employee.performance}%</b>
                    </div>
                  </td>
                  {canViewSalary && (
                    <td className="px-5 py-3.5 text-xs font-bold">
                      {formatAr(employee.salary)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ActionModal
        open={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        title={mode === "tasks" ? "Nouvelle tâche" : "Ajouter un employé"}
        description={
          mode === "tasks"
            ? "Créez une tâche locale et attribuez-la à l'équipe."
            : "Ajoutez un membre à l'équipe pour cette démonstration."
        }
        submitLabel={mode === "tasks" ? "Créer la tâche" : "Ajouter l'employé"}
        icon={mode === "tasks" ? CheckCircle2 : Users}
        fields={
          mode === "tasks"
            ? [
                {
                  name: "title",
                  label: "Tâche",
                  required: true,
                  placeholder: "Ex. Contrôler les productions du jour",
                },
                {
                  name: "assignee",
                  label: "Responsable",
                  type: "select",
                  options: team.slice(0, 8).map((employee) => employee.name),
                },
                {
                  name: "deadline",
                  label: "Échéance",
                  type: "date",
                  required: true,
                },
                {
                  name: "note",
                  label: "Consignes",
                  type: "textarea",
                  placeholder: "Informations complémentaires…",
                },
              ]
            : [
                {
                  name: "name",
                  label: "Nom complet",
                  required: true,
                  placeholder: "Ex. Soa Rakoto",
                },
                {
                  name: "role",
                  label: "Poste",
                  required: true,
                  placeholder: "Ex. Opératrice DTF",
                },
                {
                  name: "salary",
                  label: `Salaire mensuel (${currencyUnitLabel()})`,
                  type: "number",
                  placeholder: "650000",
                },
                {
                  name: "presence",
                  label: "Statut initial",
                  type: "select",
                  options: ["Présent", "Absent", "Retard", "Congé"],
                },
              ]
        }
        onSubmit={(values) => {
          if (mode === "tasks") {
            setNotice(
              `La tâche « ${values.title} » a été attribuée à ${values.assignee}.`,
            );
            return;
          }

          const employee: Employee = {
            id: `EMP-${Math.floor(100 + Math.random() * 900)}`,
            name: values.name,
            role: values.role,
            presence: values.presence as Employee["presence"],
            hours: "0h00",
            tasks: 0,
            performance: 0,
            salary: Number(values.salary) || 0,
            initials: values.name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2),
          };
          setTeam((current) => [employee, ...current]);
          setNotice(`${employee.name} a été ajouté(e) à l'équipe.`);
        }}
      />
    </div>
  );
}

const machineStatusOptions: MachineStatus[] = [
  "ACTIVE",
  "MAINTENANCE",
  "ATTENTION",
  "OFFLINE",
];

function machinesError(reason: unknown, fallback: string): string {
  return reason instanceof ApiError || reason instanceof Error
    ? reason.message
    : fallback;
}

function formatMachineDate(value: string | null): string {
  if (!value) return "À planifier";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function maintenanceKindLabel(kind: MaintenanceKind): string {
  return kind === "PREVENTIVE" ? "Préventive" : "Corrective";
}

function maintenanceStatusLabel(
  status: MaintenanceStatus,
): "Planifiée" | "En cours" | "Terminée" | "Annulée" {
  return {
    PLANNED: "Planifiée",
    IN_PROGRESS: "En cours",
    COMPLETED: "Terminée",
    CANCELLED: "Annulée",
  }[status];
}

function machineToken(): string {
  const session = readAuthSession();
  if (!session)
    throw new ApiError("Votre session a expiré. Reconnectez-vous.", 401);
  return session.tokens.accessToken;
}

export function Machines({
  mode = "machines",
}: {
  mode?: "machines" | "utilisation" | "maintenance";
}) {
  const { user } = useAuth();
  const [machineList, setMachineList] = useState<MachineRecord[]>([]);
  const [maintenanceList, setMaintenanceList] = useState<MaintenanceRecord[]>(
    [],
  );
  const [productionTasks, setProductionTasks] = useState<
    ProductionTaskRecord[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const canManage = Boolean(
    user?.roles.some((role) => ["ADMIN", "PRODUCTION_MANAGER"].includes(role)),
  );
  const maintenanceOnly = mode === "maintenance";
  const title = maintenanceOnly
    ? "Maintenance"
    : mode === "utilisation"
      ? "Ordres par machine"
      : "Machines";
  const description = maintenanceOnly
    ? "Planifiez les interventions et suivez leur état depuis le parc machines."
    : mode === "utilisation"
      ? "Consultez les ordres de production actuellement associés à chaque machine."
      : "Gérez les machines utilisées dans le catalogue produits et en production.";

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
        const [machines, maintenance, tasks] = await Promise.all([
          machinesApi.list(session.tokens.accessToken),
          machinesApi.maintenance(session.tokens.accessToken),
          productionApi.tasks(session.tokens.accessToken),
        ]);
        if (!active) return;
        setMachineList(machines);
        setMaintenanceList(maintenance);
        setProductionTasks(tasks);
      } catch (reason) {
        if (active)
          setError(
            machinesError(reason, "Impossible de charger les machines."),
          );
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const activeTasks = productionTasks.filter(
    (task) => task.stage !== "Terminé",
  );
  const plannedMaintenance = maintenanceList.filter((item) =>
    ["PLANNED", "IN_PROGRESS"].includes(item.status),
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueMaintenance = plannedMaintenance.filter(
    (item) => new Date(`${item.scheduledFor.slice(0, 10)}T00:00:00`) < today,
  );
  const machineRows = useMemo(
    () =>
      machineList.map((machine) => {
        const orders = activeTasks.filter(
          (task) => task.machine === machine.name,
        );
        return { machine, orders };
      }),
    [machineList, activeTasks],
  );
  const visibleMachines = machineRows.filter(
    ({ machine }) =>
      !maintenanceOnly ||
      machine.status === "MAINTENANCE" ||
      plannedMaintenance.some((item) => item.machineId === machine.id),
  );

  const createMachine = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setIsSaving(true);
    setFormError(null);
    try {
      const created = await machinesApi.create(machineToken(), {
        name: String(values.get("name") ?? "").trim(),
        type: String(values.get("type") ?? "").trim(),
      });
      setMachineList((current) =>
        [...current, created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setNotice(`${created.name} a été ajoutée au parc.`);
      setIsMachineModalOpen(false);
    } catch (reason) {
      setFormError(machinesError(reason, "L’ajout de la machine a échoué."));
    } finally {
      setIsSaving(false);
    }
  };

  const createMaintenance = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setIsSaving(true);
    setFormError(null);
    try {
      const created = await machinesApi.scheduleMaintenance(machineToken(), {
        machineId: String(values.get("machineId") ?? ""),
        scheduledFor: String(values.get("scheduledFor") ?? ""),
        kind: String(values.get("kind")) as MaintenanceKind,
        description: String(values.get("description") ?? "").trim(),
      });
      setMaintenanceList((current) =>
        [...current, created].sort((a, b) =>
          a.scheduledFor.localeCompare(b.scheduledFor),
        ),
      );
      setMachineList((current) =>
        current.map((machine) =>
          machine.id === created.machineId &&
          (!machine.nextMaintenanceAt ||
            created.scheduledFor < machine.nextMaintenanceAt)
            ? { ...machine, nextMaintenanceAt: created.scheduledFor }
            : machine,
        ),
      );
      setNotice(`La maintenance de ${created.machineName} a été planifiée.`);
      setIsMaintenanceModalOpen(false);
    } catch (reason) {
      setFormError(
        machinesError(reason, "La planification de maintenance a échoué."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const updateMachineStatus = async (
    machine: MachineRecord,
    status: MachineStatus,
  ) => {
    setError(null);
    try {
      const updated = await machinesApi.updateStatus(
        machineToken(),
        machine.id,
        status,
      );
      setMachineList((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setNotice(`L’état de ${updated.name} a été modifié.`);
    } catch (reason) {
      setError(machinesError(reason, "La mise à jour de la machine a échoué."));
    }
  };

  const updateMaintenance = async (
    item: MaintenanceRecord,
    status: MaintenanceStatus,
  ) => {
    setError(null);
    try {
      const updated = await machinesApi.updateMaintenanceStatus(
        machineToken(),
        item.id,
        status,
      );
      setMaintenanceList((current) =>
        current.map((record) => (record.id === updated.id ? updated : record)),
      );
      const [machines, maintenance] = await Promise.all([
        machinesApi.list(machineToken()),
        machinesApi.maintenance(machineToken()),
      ]);
      setMachineList(machines);
      setMaintenanceList(maintenance);
      setNotice(
        `L’intervention de ${updated.machineName} est maintenant « ${maintenanceStatusLabel(updated.status)} ».`,
      );
    } catch (reason) {
      setError(
        machinesError(reason, "La mise à jour de la maintenance a échoué."),
      );
    }
  };

  const metrics =
    mode === "utilisation"
      ? [
          {
            label: "Machines enregistrées",
            value: machineList.length,
            icon: Wrench,
            tone: "pink" as const,
            detail: "dans le parc",
          },
          {
            label: "Ordres en cours",
            value: activeTasks.length,
            icon: Activity,
            tone: "blue" as const,
            detail: "depuis le planning Production",
          },
          {
            label: "Machines avec ordres",
            value: machineRows.filter((row) => row.orders.length > 0).length,
            icon: Gauge,
            tone: "green" as const,
            detail: "au moins une tâche active",
          },
          {
            label: "À contrôler",
            value: activeTasks.filter(
              (task) => task.stage === "Contrôle qualité",
            ).length,
            icon: AlertTriangle,
            tone: "amber" as const,
            detail: "ordres en contrôle qualité",
          },
        ]
      : maintenanceOnly
        ? [
            {
              label: "Interventions planifiées",
              value: maintenanceList.filter((item) => item.status === "PLANNED")
                .length,
              icon: Clock3,
              tone: "blue" as const,
              detail: "dans l’historique",
            },
            {
              label: "En cours",
              value: maintenanceList.filter(
                (item) => item.status === "IN_PROGRESS",
              ).length,
              icon: Wrench,
              tone: "violet" as const,
              detail: "machines en maintenance",
            },
            {
              label: "En retard",
              value: overdueMaintenance.length,
              icon: AlertTriangle,
              tone: "amber" as const,
              detail: "date dépassée",
            },
            {
              label: "Terminées",
              value: maintenanceList.filter(
                (item) => item.status === "COMPLETED",
              ).length,
              icon: CheckCircle2,
              tone: "green" as const,
              detail: "historique enregistré",
            },
          ]
        : [
            {
              label: "Machines",
              value: machineList.length,
              icon: Gauge,
              tone: "pink" as const,
              detail: "dans le parc",
            },
            {
              label: "Actives",
              value: machineList.filter((item) => item.status === "ACTIVE")
                .length,
              icon: CheckCircle2,
              tone: "green" as const,
              detail: "prêtes à produire",
            },
            {
              label: "En maintenance",
              value: machineList.filter((item) => item.status === "MAINTENANCE")
                .length,
              icon: Wrench,
              tone: "violet" as const,
              detail: "intervention en cours",
            },
            {
              label: "À surveiller / hors service",
              value: machineList.filter((item) =>
                ["ATTENTION", "OFFLINE"].includes(item.status),
              ).length,
              icon: AlertTriangle,
              tone: "amber" as const,
              detail: "état à vérifier",
            },
          ];

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        eyebrow="Machines"
        title={title}
        description={description}
        action={
          canManage ? (
            <PrimaryButton
              icon={Plus}
              onClick={() => {
                setFormError(null);
                if (maintenanceOnly) setIsMaintenanceModalOpen(true);
                else setIsMachineModalOpen(true);
              }}
              disabled={maintenanceOnly && machineList.length === 0}
            >
              {maintenanceOnly
                ? "Planifier une maintenance"
                : "Ajouter une machine"}
            </PrimaryButton>
          ) : undefined
        }
      />
      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-200"
        >
          {error}
        </p>
      ) : null}
      {notice ? (
        <p
          role="status"
          className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200"
        >
          {notice}
        </p>
      ) : null}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            {...metric}
            value={`${metric.value}`}
          />
        ))}
      </section>

      {mode === "utilisation" ? (
        <div className="surface-card overflow-hidden">
          <div className="p-5">
            <SectionHeading
              title="Ordres actifs par machine"
              description="Comptage depuis les tâches persistées du module Production."
              action={<span />}
            />
          </div>
          {isLoading ? (
            <p className="px-5 pb-5 text-sm text-slate-500">
              Chargement des ordres…
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left">
                <thead>
                  <tr className="border-y border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 dark:border-slate-800">
                    <th className="px-5 py-3">Machine</th>
                    <th className="px-3 py-3">État</th>
                    <th className="px-3 py-3">Ordres actifs</th>
                    <th className="px-5 py-3">Prochaine maintenance</th>
                  </tr>
                </thead>
                <tbody>
                  {machineRows.map(({ machine, orders }) => (
                    <tr
                      key={machine.id}
                      className="border-b border-slate-50 text-sm dark:border-slate-800"
                    >
                      <td className="px-5 py-3.5">
                        <b>{machine.name}</b>
                        <p className="text-xs text-slate-500">{machine.type}</p>
                      </td>
                      <td className="px-3 py-3.5">
                        <StatusBadge status={machine.status} />
                      </td>
                      <td className="px-3 py-3.5">{orders.length}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {formatMachineDate(machine.nextMaintenanceAt)}
                      </td>
                    </tr>
                  ))}
                  {!machineRows.length ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-8 text-center text-sm text-slate-500"
                      >
                        Aucune machine enregistrée.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <section>
          <SectionHeading
            title={maintenanceOnly ? "Machines concernées" : "Parc machines"}
            description={
              maintenanceOnly
                ? "Machines avec une intervention active ou planifiée."
                : "Statut opérationnel et prochaine maintenance enregistrée."
            }
            action={<span />}
          />
          {isLoading ? (
            <p className="py-6 text-sm text-slate-500">
              Chargement des machines…
            </p>
          ) : (
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              {visibleMachines.map(({ machine, orders }) => (
                <article key={machine.id} className="surface-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-[#ff226d]">
                        <Wrench className="h-5 w-5" />
                      </span>
                      <div>
                        <h2 className="font-extrabold">{machine.name}</h2>
                        <p className="text-xs text-slate-500">{machine.type}</p>
                      </div>
                    </div>
                    {canManage ? (
                      <select
                        aria-label={`État de ${machine.name}`}
                        value={machine.status}
                        onChange={(event) =>
                          void updateMachineStatus(
                            machine,
                            event.target.value as MachineStatus,
                          )
                        }
                        className="min-h-10 rounded-xl border border-slate-200 bg-white px-2 text-xs font-bold dark:border-slate-700 dark:bg-slate-900"
                      >
                        {machineStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <StatusBadge status={machine.status} />
                    )}
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs dark:border-slate-800">
                    <div>
                      <p className="text-slate-400">Prochaine maintenance</p>
                      <b className="mt-1 block">
                        {formatMachineDate(machine.nextMaintenanceAt)}
                      </b>
                    </div>
                    <div>
                      <p className="text-slate-400">Ordres actifs</p>
                      <b className="mt-1 block">{orders.length}</b>
                    </div>
                  </div>
                </article>
              ))}
              {!visibleMachines.length ? (
                <p className="surface-card col-span-full p-8 text-center text-sm text-slate-500">
                  {maintenanceOnly
                    ? "Aucune intervention active ou planifiée."
                    : "Aucune machine enregistrée. Ajoutez la première machine au parc."}
                </p>
              ) : null}
            </div>
          )}
        </section>
      )}

      {maintenanceOnly ? (
        <section className="surface-card p-5">
          <SectionHeading
            title="Historique des interventions"
            description="Les interventions planifiées, en cours, terminées ou annulées."
            action={<span />}
          />
          <div className="mt-4 space-y-3">
            {maintenanceList.map((item) => (
              <article
                key={item.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-extrabold">{item.machineName}</h3>
                    <StatusBadge status={maintenanceStatusLabel(item.status)} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatMachineDate(item.scheduledFor)} ·{" "}
                    {maintenanceKindLabel(item.kind)}
                  </p>
                  <p className="mt-2 text-sm">{item.description}</p>
                </div>
                {canManage && item.status === "PLANNED" ? (
                  <div className="flex flex-wrap gap-2">
                    <SecondaryButton
                      disabled={isSaving}
                      onClick={() =>
                        void updateMaintenance(item, "IN_PROGRESS")
                      }
                    >
                      Démarrer
                    </SecondaryButton>
                    <SecondaryButton
                      disabled={isSaving}
                      onClick={() => void updateMaintenance(item, "COMPLETED")}
                    >
                      Terminer
                    </SecondaryButton>
                    <SecondaryButton
                      disabled={isSaving}
                      onClick={() => void updateMaintenance(item, "CANCELLED")}
                    >
                      Annuler
                    </SecondaryButton>
                  </div>
                ) : null}
                {canManage && item.status === "IN_PROGRESS" ? (
                  <div className="flex flex-wrap gap-2">
                    <PrimaryButton
                      disabled={isSaving}
                      onClick={() => void updateMaintenance(item, "COMPLETED")}
                    >
                      Terminer l’intervention
                    </PrimaryButton>
                    <SecondaryButton
                      disabled={isSaving}
                      onClick={() => void updateMaintenance(item, "CANCELLED")}
                    >
                      Annuler
                    </SecondaryButton>
                  </div>
                ) : null}
              </article>
            ))}
            {!maintenanceList.length ? (
              <p className="py-6 text-center text-sm text-slate-500">
                Aucune maintenance enregistrée.
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      <Modal
        open={isMachineModalOpen}
        onClose={() => !isSaving && setIsMachineModalOpen(false)}
        title="Ajouter une machine"
        description="Cette machine pourra être sélectionnée dans les paramètres de production des produits."
        icon={Wrench}
      >
        <form
          onSubmit={(event) => void createMachine(event)}
          className="space-y-4"
        >
          {formError ? (
            <p
              role="alert"
              className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700"
            >
              {formError}
            </p>
          ) : null}
          <label className="field-label">
            Nom de la machine
            <input
              required
              minLength={2}
              maxLength={120}
              name="name"
              autoFocus
              className="field-input"
              placeholder="Ex. DTF Pro 60"
            />
          </label>
          <label className="field-label">
            Type / poste
            <input
              required
              maxLength={80}
              name="type"
              className="field-input"
              placeholder="Ex. Imprimante DTF"
            />
          </label>
          <ModalFooter>
            <SecondaryButton
              disabled={isSaving}
              onClick={() => setIsMachineModalOpen(false)}
            >
              Annuler
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={isSaving}>
              {isSaving ? "Enregistrement…" : "Ajouter la machine"}
            </PrimaryButton>
          </ModalFooter>
        </form>
      </Modal>

      <Modal
        open={isMaintenanceModalOpen}
        onClose={() => !isSaving && setIsMaintenanceModalOpen(false)}
        title="Planifier une maintenance"
        description="Enregistrez la date et le travail prévu sur une machine du parc."
        icon={Wrench}
      >
        <form
          onSubmit={(event) => void createMaintenance(event)}
          className="space-y-4"
        >
          {formError ? (
            <p
              role="alert"
              className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700"
            >
              {formError}
            </p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field-label sm:col-span-2">
              Machine
              <select
                required
                name="machineId"
                className="field-input"
                defaultValue={machineList[0]?.id ?? ""}
              >
                {machineList.map((machine) => (
                  <option key={machine.id} value={machine.id}>
                    {machine.name} · {machine.type}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Date prévue
              <input
                required
                type="date"
                name="scheduledFor"
                className="field-input"
              />
            </label>
            <label className="field-label">
              Type
              <select name="kind" className="field-input">
                <option value="PREVENTIVE">Préventive</option>
                <option value="CORRECTIVE">Corrective</option>
              </select>
            </label>
            <label className="field-label sm:col-span-2">
              Intervention prévue
              <textarea
                required
                maxLength={512}
                name="description"
                rows={3}
                className="field-input h-auto resize-none py-3"
                placeholder="Ex. Nettoyage et contrôle des lentilles"
              />
            </label>
          </div>
          <ModalFooter>
            <SecondaryButton
              disabled={isSaving}
              onClick={() => setIsMaintenanceModalOpen(false)}
            >
              Annuler
            </SecondaryButton>
            <PrimaryButton
              type="submit"
              disabled={isSaving || machineList.length === 0}
            >
              {isSaving ? "Planification…" : "Planifier"}
            </PrimaryButton>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
