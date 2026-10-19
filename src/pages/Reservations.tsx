import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import SidebarNav from "@/components/SidebarNav";
import TopNav from "@/components/TopNav";
import ReservationListView from "@/components/ReservationListView";
import ReservationDetailModal from "@/components/ReservationDetailModal";
import { mockReservationData, type ReservationData, type ReservationStatus } from "@/types/reservation";
import WeeklyCalendar from "@/components/WeeklyCalendar";

const ViewToggle = ({
  active,
  onChange,
}: {
  active: "calendrier" | "liste";
  onChange: (v: "calendrier" | "liste") => void;
}) => (
  <div className="inline-flex rounded-[15px] bg-white p-[5px] shadow-[0_20px_25px_rgba(15,23,42,0.14)]">
    <div className="inline-flex rounded-xl shadow-[0_28px_65px_-22px_rgba(82,96,255,0.36)] bg-[#e7e7e7] ">
      <button
        onClick={() => onChange("calendrier")}
        className={`min-w-[100px] rounded-xl px-6 py-4 text-sm font-semibold leading-none transition-colors ${
          active === "calendrier"
            ? "bg-[#1677eb] text-white"
            : "text-[#111111] hover:text-[#1f2937]"
        }`}
      >
        Calendrier
      </button>
      <button
        onClick={() => onChange("liste")}
        className={`min-w-[150px] rounded-xl px-6 py-3 text-sm font-semibold leading-none transition-colors ${
          active === "liste"
            ? "bg-[#1677eb] text-white"
            : "text-[#111111] hover:text-[#1f2937]"
        }`}
      >
        Liste
      </button>
    </div>
  </div>
);

const Reservations = () => {
  const [viewMode, setViewMode] = useState<"calendrier" | "liste">("calendrier");
  const [reservations, setReservations] = useState<ReservationData[]>(mockReservationData);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleSelectReservation = (reservation: ReservationData) => {
    setSelectedReservationId(reservation.id);
    setModalOpen(true);
  };

  const selectedReservation = useMemo(
    () => reservations.find((reservation) => reservation.id === selectedReservationId) ?? null,
    [reservations, selectedReservationId]
  );

  const handleUpdateReservation = (updatedReservation: ReservationData) => {
    setReservations((prev) =>
      prev.map((reservation) => (reservation.id === updatedReservation.id ? updatedReservation : reservation))
    );
  };

  const handleDeleteReservation = (reservationId: string) => {
    setReservations((prev) => prev.filter((reservation) => reservation.id !== reservationId));
    setModalOpen(false);
    setSelectedReservationId((current) => (current === reservationId ? null : current));
  };

  const handleEditReservation = (reservation: ReservationData) => {
    setSelectedReservationId(reservation.id);
    setModalOpen(true);
  };

  const handleChangeReservationStatus = (reservationId: string, status: ReservationStatus) => {
    setReservations((prev) =>
      prev.map((reservation) => (reservation.id === reservationId ? { ...reservation, status } : reservation))
    );
  };

  return (
    <div className="page-shell flex min-h-screen bg-[#edeef7]">
      <SidebarNav />

      <main className="flex-1 min-w-0 p-4 pt-16 lg:p-6 lg:pl-6 lg:pt-6">
        <div className="mx-auto w-full max-w-[1400px]">
          <TopNav title="LOGEMENT" />

          <div className="mt-7 mb-5 flex items-center justify-between flex-wrap gap-3">
            <ViewToggle active={viewMode} onChange={setViewMode} />
            <Link
              to="/logements/create"
              className="flex items-center gap-2 rounded-xl bg-[#007BFF] px-5 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-opacity hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              Créer un logement
            </Link>
          </div>

          {viewMode === "calendrier" ? (
            <WeeklyCalendar
              reservations={reservations}
              onSelectReservation={handleSelectReservation}
            />
          ) : (
            <ReservationListView
              reservations={reservations}
              onSelectReservation={handleSelectReservation}
              onEditReservation={handleEditReservation}
              onDeleteReservation={handleDeleteReservation}
              onChangeReservationStatus={handleChangeReservationStatus}
            />
          )}
        </div>
      </main>

      <ReservationDetailModal
        reservation={selectedReservation}
        open={modalOpen}
        onUpdateReservation={handleUpdateReservation}
        onDeleteReservation={handleDeleteReservation}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default Reservations;
