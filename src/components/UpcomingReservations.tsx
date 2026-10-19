import { useNavigate } from "react-router-dom";

/** Upcoming reservations panel */
const reservations = [
  { name: "Reservation1 : Joe Doe", date: "20 Février 2026 à 14h30" },
  { name: "Reservation1 : Julie .G", date: "20 Février 2026 à 14h30" },
];

const UpcomingReservations = () => {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate("/reservations");
  };

  return (
    <div className="bg-card rounded-2xl shadow-sm p-5 lg:p-6 flex flex-col">
      <h3 className="text-lg font-bold text-foreground mb-3">Réservations à venir</h3>
      <div className="border-t border-border" />

      <div className="flex flex-col gap-3 mt-4 flex-1">
        {reservations.map((r, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="font-semibold text-foreground">{r.name}</span>
            <span className="text-muted-foreground text-xs lg:text-sm">{r.date}</span>
          </div>
        ))}
      </div>

      {/* Consulter button */}
      <div className="flex justify-end mt-4">
        <button onClick={handleClick} className="bg-primary text-primary-foreground text-sm font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity">
          Consulter
        </button>
      </div>
    </div>
  );
};

export default UpcomingReservations;
