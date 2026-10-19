import { useEffect, useMemo, useState } from "react";
import { CalendarIcon, ChevronRight, ChevronUp, ChevronDown, X } from "lucide-react";
import type { Property } from "./PropertyListSidebar";

export interface CalendarSelectionSettings {
  availability: "available" | "blocked";
  minHours: number;
  maxHours: number;
  closeArrival: boolean;
  closeDeparture: boolean;
}

interface CalendarRightPanelProps {
  selectedDayLabel: string;
  selectedProperty: Property | null;
  selectedPropertyStatus: "available" | "reserved" | "blocked" | null;
  isSelectionInPast: boolean;
  initialSettings: CalendarSelectionSettings;
  onSaveSettings: (settings: CalendarSelectionSettings) => void;
  onClose: () => void;
}

const CalendarRightPanel = ({
  selectedDayLabel,
  selectedProperty,
  selectedPropertyStatus,
  isSelectionInPast,
  initialSettings,
  onSaveSettings,
  onClose,
}: CalendarRightPanelProps) => {
  const [availability, setAvailability] = useState<"available" | "blocked">(initialSettings.availability);
  const [minHours, setMinHours] = useState(initialSettings.minHours);
  const [maxHours, setMaxHours] = useState(initialSettings.maxHours);
  const [closeArrival, setCloseArrival] = useState(initialSettings.closeArrival);
  const [closeDeparture, setCloseDeparture] = useState(initialSettings.closeDeparture);

  const hasSelection = Boolean(selectedProperty);
  const canEditSelection = hasSelection && selectedPropertyStatus !== "reserved" && !isSelectionInPast;

  useEffect(() => {
    setAvailability(initialSettings.availability);
    setMinHours(initialSettings.minHours);
    setMaxHours(initialSettings.maxHours);
    setCloseArrival(initialSettings.closeArrival);
    setCloseDeparture(initialSettings.closeDeparture);
  }, [initialSettings, selectedProperty?.id, selectedDayLabel, selectedPropertyStatus]);

  const endDayLabel = useMemo(() => {
    const [day, month, year] = selectedDayLabel.split("/");
    if (!day || !month || !year) return selectedDayLabel;

    const date = new Date(Number(year), Number(month) - 1, Number(day));
    if (Number.isNaN(date.getTime())) return selectedDayLabel;
    date.setDate(date.getDate() + 4);

    const endDay = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
    return endDay;
  }, [selectedDayLabel]);

  const canSave = canEditSelection && minHours <= maxHours;

  const stepMinHours = (delta: number) => {
    setMinHours((prev) => Math.max(1, Math.min(24, prev + delta)));
  };

  const stepMaxHours = (delta: number) => {
    setMaxHours((prev) => Math.max(1, Math.min(24, prev + delta)));
  };

  const handleSave = () => {
    if (!canSave) return;
    onSaveSettings({ availability, minHours, maxHours, closeArrival, closeDeparture });
  };

  return (
    <div className="relative rounded-[24px] border border-[#c8c8cd] bg-[#fff] p-4 lg:p-5">
      

      <div className="mx-auto max-w-[330px] space-y-4 pr-8">
        <div className="flex items-center justify-between">
          <h3 className="text-[20px] font-semibold tracking-[-0.01em] text-[#121217]">Dates sélectionnées</h3>
          <button
            onClick={onClose}
            className="grid h-9 w-10 place-items-center rounded-[8px] border border-[#bfc0c7] text-[#1f1f23]"
            aria-label="Réduire le panneau"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-[8px] border border-[#b8b8bf] px-3 py-2.5">
          <CalendarIcon className="h-4 w-4 text-[#2b2b2f]" />
          <span className="text-[14px] font-medium text-[#2b2b2f]">{selectedDayLabel}</span>
          <ChevronRight className="h-3.5 w-3.5 text-[#2b2b2f]" />
          <span className="text-[14px] font-medium text-[#2b2b2f]">{endDayLabel}</span>
        </div>

        <div>
          <p className="mb-2 text-[17px] font-semibold text-[#18181c]">Disponibilité</p>
          <div className="flex items-center gap-6 text-[14px] text-[#17171b]">
            <button
              type="button"
              onClick={() => setAvailability("available")}
              className="inline-flex items-center gap-3"
              disabled={!canEditSelection}
            >
              <span
                className={`h-4 w-4 rounded-full border ${
                  availability === "available" ? "border-[#b6d4f0] bg-[#b6d4f0]" : "border-[#b6d4f0] bg-transparent"
                }`}
              />
              Disponible
            </button>
            <button
              type="button"
              onClick={() => setAvailability("blocked")}
              className="inline-flex items-center gap-3"
              disabled={!canEditSelection}
            >
              <span className="h-4 w-4 rounded-full border-2 border-[#ff2e7d]" />
              Bloqué
            </button>
          </div>
        </div>

        <div className="border-t border-[#c9c9cf] pt-3">
          <h4 className="mb-3 text-[17px] font-semibold text-[#17171b]">Option avancée</h4>

          <div className="space-y-3.5">
            <div>
              <p className="mb-1 text-[14px] font-semibold text-[#202025]">Nombre d’heure min</p>
              <div className="flex h-11 items-center rounded-xl border border-[#c2c2c9] bg-[#e9e9ee] pl-4 pr-2">
                <span className="flex-1 text-center text-[20px] leading-none text-[#2c2c31]">{minHours}</span>
                <div className="flex flex-col">
                  <button type="button" onClick={() => stepMinHours(1)} disabled={!canEditSelection}>
                    <ChevronUp className="h-4 w-4 text-black" />
                  </button>
                  <button type="button" onClick={() => stepMinHours(-1)} disabled={!canEditSelection}>
                    <ChevronDown className="h-4 w-4 text-black" />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-1 text-[14px] font-semibold text-[#202025]">Nombre d’heure max</p>
              <div className="flex h-11 items-center rounded-xl border border-[#c2c2c9] bg-[#e9e9ee] pl-4 pr-2">
                <span className="flex-1 text-center text-[20px] leading-none text-[#2c2c31]">{maxHours}</span>
                <div className="flex flex-col">
                  <button type="button" onClick={() => stepMaxHours(1)} disabled={!canEditSelection}>
                    <ChevronUp className="h-4 w-4 text-black" />
                  </button>
                  <button type="button" onClick={() => stepMaxHours(-1)} disabled={!canEditSelection}>
                    <ChevronDown className="h-4 w-4 text-black" />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-[15px] font-semibold text-[#17171b]">Fermer le logement pour l’arrivée</p>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCloseArrival(false)}
                  disabled={!canEditSelection}
                  className={`h-9 w-[84px] rounded-full border text-[20px] leading-none ${
                    !closeArrival ? "border-[#b5b5b9] text-[#1bd236]" : "border-[#d7d7dd] text-[#8bd399]"
                  }`}
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => setCloseArrival(true)}
                  disabled={!canEditSelection}
                  className={`h-9 w-[84px] rounded-full border text-[20px] leading-none ${
                    closeArrival ? "border-[#f2a8c6] text-[#ff2e7d]" : "border-[#e4c8d5] text-[#f39bc1]"
                  }`}
                >
                  ✕
                </button>
              </div>
            </div>

            <div>
              <p className="mb-2 text-[15px] font-semibold text-[#17171b]">Fermer le logement pour le départ</p>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCloseDeparture(false)}
                  disabled={!canEditSelection}
                  className={`h-9 w-[84px] rounded-full border text-[20px] leading-none ${
                    !closeDeparture ? "border-[#b5b5b9] text-[#1bd236]" : "border-[#d7d7dd] text-[#8bd399]"
                  }`}
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => setCloseDeparture(true)}
                  disabled={!canEditSelection}
                  className={`h-9 w-[84px] rounded-full border text-[20px] leading-none ${
                    closeDeparture ? "border-[#f2a8c6] text-[#ff2e7d]" : "border-[#e4c8d5] text-[#f39bc1]"
                  }`}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>

        {!canEditSelection ? (
          <p className="text-center text-[12px] text-[#5f6067]">
            {isSelectionInPast
              ? "Les dates passees ne sont pas modifiables."
              : "Selectionnez un logement non reserve pour modifier."}
          </p>
        ) : null}

        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="mx-auto block w-[168px] rounded-[10px] bg-[#1177eb] py-2 text-[16px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
};

export default CalendarRightPanel;
