import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import type { ReservationData, ReservationStatus } from "@/types/reservation";

const statusStyles: Record<string, string> = {
  confirmed: "bg-[hsl(145,63%,49%)] text-white",
  cancelled: "bg-[hsl(0,84%,60%)] text-white",
  pending: "bg-yellow-400 text-[hsl(220,20%,14%)]",
};

const statusLabels: Record<string, string> = {
  confirmed: "Confirmé",
  cancelled: "Annulé",
  pending: "En attente",
};

interface ReservationListViewProps {
  reservations: ReservationData[];
  onSelectReservation: (reservation: ReservationData) => void;
  onEditReservation: (reservation: ReservationData) => void;
  onDeleteReservation: (reservationId: string) => void;
  onChangeReservationStatus: (reservationId: string, status: ReservationStatus) => void;
}

const ReservationListView = ({
  reservations,
  onSelectReservation,
  onEditReservation,
  onDeleteReservation,
  onChangeReservationStatus,
}: ReservationListViewProps) => {
  const nextStatus = (status: ReservationStatus): ReservationStatus => {
    if (status === "confirmed") return "pending";
    if (status === "pending") return "cancelled";
    return "confirmed";
  };

  return (
    <div className="reservation-glow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[hsl(220,13%,91%)]">
              <th className="text-left py-4 px-5 font-semibold text-[hsl(220,20%,14%)]">Clients</th>
              <th className="text-left py-4 px-4 font-semibold text-[hsl(220,20%,14%)]">Logement</th>
              <th className="text-left py-4 px-4 font-semibold text-[hsl(220,20%,14%)]">Date</th>
              <th className="text-left py-4 px-4 font-semibold text-[hsl(220,20%,14%)]">Créneau</th>
              <th className="text-left py-4 px-4 font-semibold text-[hsl(220,20%,14%)]">Source</th>
              <th className="text-left py-4 px-4 font-semibold text-[hsl(220,20%,14%)]">Statut</th>
              <th className="text-left py-4 px-4 font-semibold text-[hsl(220,20%,14%)]">Montant</th>
              <th className="text-left py-4 px-4 font-semibold text-[hsl(220,20%,14%)]">Action</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((res) => (
              <tr
                key={res.id}
                className="border-b border-[hsl(220,13%,91%)] last:border-0 hover:bg-[hsl(220,14%,96%)]/30 cursor-pointer transition-colors"
                onClick={() => onSelectReservation(res)}
              >
                <td className="py-4 px-5">
                  <div className="font-semibold text-[hsl(220,20%,14%)]">{res.clientName}</div>
                  <div className="text-[hsl(220,9%,46%)] text-xs italic">{res.clientEmail}</div>
                </td>
                <td className="py-4 px-4 font-medium text-[hsl(220,20%,14%)]">{res.property}</td>
                <td className="py-4 px-4 text-[hsl(220,20%,14%)]">{res.date}</td>
                <td className="py-4 px-4 text-[hsl(220,20%,14%)]">{res.timeSlot}</td>
                <td className="py-4 px-4">
                  <span className="inline-block bg-[hsl(211,100%,50%)] text-white text-xs font-medium px-4 py-1.5 rounded-full">
                    {res.source}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChangeReservationStatus(res.id, nextStatus(res.status));
                    }}
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full ${statusStyles[res.status]}`}
                    title="Changer le statut"
                  >
                    {statusLabels[res.status]}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </td>
                <td className="py-4 px-4 font-semibold text-[hsl(220,20%,14%)]">{res.amount}€</td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditReservation(res);
                      }}
                      className="text-[hsl(211,100%,50%)] hover:text-[hsl(211,100%,50%)]/80 transition-colors"
                      title="Modifier la réservation"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteReservation(res.id);
                      }}
                      className="text-[hsl(0,84%,60%)] hover:text-[hsl(0,84%,60%)]/80 transition-colors"
                      title="Supprimer la réservation"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden">
        {reservations.map((res) => (
          <div
            key={`mobile-${res.id}`}
            className="p-4 border-b border-[hsl(220,13%,91%)] last:border-0 cursor-pointer hover:bg-[hsl(220,14%,96%)]/30"
            onClick={() => onSelectReservation(res)}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-semibold text-[hsl(220,20%,14%)]">{res.clientName}</div>
                <div className="text-[hsl(220,9%,46%)] text-xs italic">{res.clientEmail}</div>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusStyles[res.status]}`}>
                {statusLabels[res.status]}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[hsl(220,9%,46%)] mt-2">
              <span>{res.property}</span>
              <span>{res.date}</span>
              <span>{res.timeSlot}</span>
              <span className="font-semibold text-[hsl(220,20%,14%)]">{res.amount}€</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReservationListView;
