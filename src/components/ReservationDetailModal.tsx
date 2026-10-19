import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useDialogBehavior } from "@/hooks/useDialogBehavior";
import { X, ChevronDown, Pencil, Trash2, CalendarDays, Clock, User, CreditCard } from "lucide-react";
import type { ReservationData } from "@/types/reservation";
import villa from "@/assets/villa6.png";

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

interface ReservationDetailModalProps {
  reservation: ReservationData | null;
  open: boolean;
  onUpdateReservation: (reservation: ReservationData) => void;
  onDeleteReservation: (reservationId: string) => void;
  onClose: () => void;
}

const ReservationDetailModal = ({
  reservation,
  open,
  onUpdateReservation,
  onDeleteReservation,
  onClose,
}: ReservationDetailModalProps) => {
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<ReservationData | null>(reservation);
  const titleId = useId();
  const { dialogRef, close } = useDialogBehavior(open && Boolean(reservation), onClose);

  useEffect(() => {
    setEditMode(false);
    setDraft(reservation);
  }, [reservation]);

  if (!reservation || !open) return null;

  const current = draft ?? reservation;

  const handleSave = () => {
    if (!draft) return;
    onUpdateReservation(draft);
    setEditMode(false);
  };

  const handleDelete = () => {
    onDeleteReservation(reservation.id);
  };

  const updateDraft = <K extends keyof ReservationData>(key: K, value: ReservationData[K]) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[80] bg-black/25 backdrop-blur-[1px]"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      />

      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="reservation-glow-card fixed inset-x-2 bottom-2 z-[81] max-h-[calc(100dvh-1rem)] overflow-y-auto overscroll-contain rounded-t-3xl pb-[env(safe-area-inset-bottom)] animate-in slide-in-from-bottom duration-200 sm:inset-y-4 sm:left-auto sm:right-4 sm:w-[420px] sm:max-w-[calc(100%-2rem)] sm:rounded-2xl sm:pb-0 sm:animate-in sm:slide-in-from-right"
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 id={titleId} className="text-base font-extrabold tracking-tight uppercase text-[hsl(220,20%,14%)]">
            Details de Reservation
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Fermer la fiche de réservation"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[hsl(220,13%,91%)] hover:bg-[hsl(220,14%,96%)] transition-colors"
          >
            <X className="w-4 h-4 text-[hsl(220,20%,14%)]" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-[72px] h-[50px] rounded-xl bg-[hsl(220,14%,96%)] overflow-hidden flex-shrink-0">
              <img src={villa} alt="" className="h-full" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#000] font-bold">Logement</div>
              <div className="font-bold italic text-[hsl(220,20%,14%)] text-sm">{current.property}</div>
              <div className="text-xs text-[hsl(220,9%,46%)] mt-1.5">Capacité : {current.propertyCapacity} personnes</div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0 pt-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: current.propertyColor }} 
              />
              <span className="text-xs font-semibold" style={{ color: current.propertyColor }}>
                {current.propertyColor}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {current.propertyAmenities.map((a) => (
              <span
                key={a}
                className="px-4 py-1.5 rounded-full text-xs font-medium border  text-[white] bg-black"
              >
                {a}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#E8F4FD] rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <CalendarDays className="w-4 h-4 text-[#2196F3]" />
                <span className="text-xs font-bold text-[#2196F3] uppercase">Date</span>
              </div>
              <div className="text-sm font-medium text-[hsl(220,20%,14%)] leading-snug">{current.date}</div>
            </div>
            <div className="bg-[#E8F4FD] rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Clock className="w-4 h-4 text-[#2196F3]" />
                <span className="text-xs font-bold text-[#2196F3] uppercase">Heure</span>
              </div>
              <div className="text-sm font-medium text-[hsl(220,20%,14%)]">{current.timeSlot}</div>
            </div>
          </div>

          <div className="bg-[#F5F5F5] rounded-xl p-4 space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-[black]" />
              <span className="text-sm font-bold text-[black] uppercase">Client</span>
            </div>
            <div className="text-sm text-[hsl(220,20%,14%)] italic">Nom: {current.clientName}</div>
            <div className="text-sm text-[hsl(220,20%,14%)] italic">Email : {current.clientEmail}</div>
            <div className="text-sm text-[hsl(220,20%,14%)] italic">Téléphone: {current.clientPhone}</div>
            <div className="text-sm text-[hsl(220,20%,14%)] italic">Nombre de personnes : {current.clientCount}</div>
          </div>

          <div className="flex items-start gap-10">
            <div>
              <div className="text-sm font-semibold text-[#000] mb-2">Statut</div>
              {editMode ? (
                <div className="flex flex-wrap gap-2">
                  {(["confirmed", "pending", "cancelled"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => updateDraft("status", status)}
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-[5px] border ${
                        current.status === status ? statusStyles[status] : "bg-white text-[#000]"
                      }`}
                    >
                      {statusLabels[status]}
                    </button>
                  ))}
                </div>
              ) : (
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-5 py-2 rounded-full ${statusStyles[current.status]}`}>
                  {statusLabels[current.status]}
                  <ChevronDown className="w-3 h-3" />
                </span>
              )}
            </div>
            <div>
              <div className="text-sm font-semibold text-[hsl(220,20%,14%)] mb-2">Paiement</div>
              {editMode ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateDraft("payment", "paid")}
                    className={`inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full border ${
                      current.payment === "paid"
                        ? "bg-[hsl(145,63%,49%)] text-white border-transparent"
                        : "bg-white text-[hsl(220,20%,14%)] border-[hsl(220,13%,91%)]"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    Payé
                  </button>
                  <button
                    type="button"
                    onClick={() => updateDraft("payment", "unpaid")}
                    className={`inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full border ${
                      current.payment === "unpaid"
                        ? "bg-[hsl(0,84%,60%)] text-white border-transparent"
                        : "bg-white text-[hsl(220,20%,14%)] border-[hsl(220,13%,91%)]"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    Non payé
                  </button>
                </div>
              ) : (
                <span className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2 rounded-full border border-[hsl(220,13%,91%)] bg-white text-[hsl(220,20%,14%)]">
                  <CreditCard className="w-4 h-4" />
                  {current.payment === "paid" ? "Payé" : "Non payé"}
                </span>
              )}
            </div>
          </div>

          <div>
            <div className="text-sm font-bold italic text-[hsl(220,20%,14%)] mb-1">Détails du prix</div>
            <div className="flex items-center gap-6 text-sm">
              <span>
                <span className="font-bold italic">Total : </span>
                <span className="font-bold text-[#2196F3] italic">{current.amount}€</span>
              </span>
              <span>
                <span className="font-bold italic">Source: </span>
                <span className="font-bold text-[#2196F3] italic">{current.source.toLowerCase()}</span>
              </span>
              <span>
                <span className="font-bold italic">Ref: </span>
                <span className="font-bold text-[#2196F3] italic">{current.reference}</span>
              </span>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-[hsl(220,20%,14%)] mb-1.5">Note</div>
            {editMode ? (
              <textarea
                value={current.note}
                onChange={(event) => updateDraft("note", event.target.value)}
                className="w-full min-h-[92px] resize-none rounded-xl border border-[hsl(220,13%,91%)] px-4 py-3 text-sm text-[hsl(220,20%,14%)] outline-none focus:border-[hsl(211,100%,50%)]"
              />
            ) : (
              <div className="bg-[#F5F5F5] rounded-xl px-4 py-3 text-sm text-[hsl(220,9%,46%)]">
                {current.note}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            {editMode ? (
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 bg-[#2196F3] text-white rounded-xl py-3 font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <Pencil className="w-4 h-4" />
                Enregistrer
              </button>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-[#2196F3] text-white rounded-xl py-3 font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <Pencil className="w-4 h-4" />
                Modifier
              </button>
            )}
            <button
              onClick={handleDelete}
              className="flex-1 flex items-center justify-center gap-2 bg-[#EF4444] text-white rounded-xl py-3 font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          </div>

          {editMode ? (
            <button
              onClick={() => {
                setEditMode(false);
                setDraft(reservation);
              }}
              className="w-full rounded-xl border border-[hsl(220,13%,91%)] py-2.5 text-sm font-semibold text-[hsl(220,20%,14%)] hover:bg-[hsl(220,14%,96%)] transition-colors"
            >
              Annuler
            </button>
          ) : null}
        </div>
      </section>
    </>,
    document.body,
  );
};

export default ReservationDetailModal;
