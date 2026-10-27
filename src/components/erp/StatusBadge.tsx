import type { OrderStatus, Priority, StockStatus } from "@/types/erp";

type Status =
  | OrderStatus
  | StockStatus
  | Priority
  | "ACTIVE"
  | "MAINTENANCE"
  | "OFFLINE"
  | "ATTENTION"
  | "Présent"
  | "Absent"
  | "Retard"
  | "Congé"
  | "Brouillon"
  | "Envoyé"
  | "Accepté"
  | "Refusé"
  | "Expiré"
  | "Émise"
  | "Partiellement payée"
  | "Payée"
  | "Entrée"
  | "Sortie"
  | "Ajustement"
  | "Planifiée"
  | "En cours"
  | "Terminée"
  | "Annulée";

const styles: Record<string, string> = {
  Nouveau: "bg-blue-50 text-blue-700 ring-blue-100",
  Confirmé: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  "À produire": "bg-violet-50 text-violet-700 ring-violet-100",
  "En production": "bg-amber-50 text-amber-800 ring-amber-100",
  "Contrôle qualité": "bg-orange-50 text-orange-700 ring-orange-100",
  Prêt: "bg-cyan-50 text-cyan-700 ring-cyan-100",
  Livré: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Terminé: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  "En attente": "bg-slate-100 text-slate-600 ring-slate-200",
  Bloqué: "bg-rose-50 text-rose-700 ring-rose-100",
  Annulé: "bg-slate-100 text-slate-500 ring-slate-200",
  "En stock": "bg-emerald-50 text-emerald-700 ring-emerald-100",
  "Stock faible": "bg-amber-50 text-amber-800 ring-amber-100",
  Critique: "bg-orange-50 text-orange-700 ring-orange-100",
  Rupture: "bg-rose-50 text-rose-700 ring-rose-100",
  Normale: "bg-slate-100 text-slate-600 ring-slate-200",
  Haute: "bg-amber-50 text-amber-800 ring-amber-100",
  Urgente: "bg-rose-50 text-rose-700 ring-rose-100",
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  MAINTENANCE: "bg-violet-50 text-violet-700 ring-violet-100",
  OFFLINE: "bg-slate-100 text-slate-600 ring-slate-200",
  ATTENTION: "bg-amber-50 text-amber-800 ring-amber-100",
  Présent: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Absent: "bg-rose-50 text-rose-700 ring-rose-100",
  Retard: "bg-amber-50 text-amber-800 ring-amber-100",
  Congé: "bg-blue-50 text-blue-700 ring-blue-100",
  Brouillon: "bg-slate-100 text-slate-600 ring-slate-200",
  Envoyé: "bg-blue-50 text-blue-700 ring-blue-100",
  Accepté: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Refusé: "bg-rose-50 text-rose-700 ring-rose-100",
  Expiré: "bg-amber-50 text-amber-800 ring-amber-100",
  Émise: "bg-blue-50 text-blue-700 ring-blue-100",
  "Partiellement payée": "bg-amber-50 text-amber-800 ring-amber-100",
  Payée: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Entrée: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Sortie: "bg-rose-50 text-rose-700 ring-rose-100",
  Ajustement: "bg-amber-50 text-amber-800 ring-amber-100",
  Planifiée: "bg-blue-50 text-blue-700 ring-blue-100",
  "En cours": "bg-amber-50 text-amber-800 ring-amber-100",
  Terminée: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Annulée: "bg-slate-100 text-slate-500 ring-slate-200",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${styles[status] ?? styles["En attente"]}`}
    >
      {status}
    </span>
  );
}
