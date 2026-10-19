import { AlertTriangle } from "lucide-react";

/** Alerts panel showing recent warnings */
const alerts = [
  { text: "Paiement en retard", time: "il y a 2 jours" },
  { text: "Conflit calendrier", time: "il y a 15mn" },
];

const AlertsPanel = () => {
  return (
    <div className="bg-card rounded-2xl shadow-sm p-5 lg:p-6 flex flex-col">
      <h3 className="text-lg font-bold text-foreground mb-3">Alertes</h3>

      <div className="flex flex-col gap-2.5 flex-1">
        {alerts.map((alert, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
            <span>
              <span className="font-semibold text-foreground">{alert.text}</span>
              <span className="text-muted-foreground"> - {alert.time}</span>
            </span>
          </div>
        ))}
      </div>

      {/* Consulter button - dark variant */}
      <div className="flex justify-end mt-4">
        <button className="bg-foreground text-card text-sm font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity">
          Consulter
        </button>
      </div>
    </div>
  );
};

export default AlertsPanel;
