import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, startOfWeek, addDays, addWeeks, subWeeks } from "date-fns";
import { fr } from "date-fns/locale";
import type { ReservationData } from "@/types/reservation";

const colorMap: Record<string, string> = {
  blue: "bg-[hsl(209,100%,87%)] text-[hsl(220,20%,14%)]",
  orange: "bg-[hsl(27,100%,50%)] text-white",
  dark: "bg-[hsl(210,11%,15%)] text-white",
  green: "bg-[hsl(145,63%,49%)] text-white",
  pink: "bg-[hsl(330,100%,59%)] text-white",
  gray: "bg-[hsl(0,0%,85%)] text-[hsl(220,20%,14%)]",
};

const DAY_LABELS = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];
const HOURS = [9, 10, 11, 12, 13, 14, 15];
const HOUR_HEIGHT = 80;

interface WeeklyCalendarProps {
  reservations: ReservationData[];
  onSelectReservation: (reservation: ReservationData) => void;
}

const WeeklyCalendar = ({ reservations = [], onSelectReservation }: WeeklyCalendarProps) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(2026, 2, 18), { weekStartsOn: 1 })
  );

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart]
  );

  const goToPrevWeek = () => setCurrentWeekStart((d) => subWeeks(d, 1));
  const goToNextWeek = () => setCurrentWeekStart((d) => addWeeks(d, 1));
  const goToToday = () =>
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const weekLabel = useMemo(() => {
    const day = currentWeekStart.getDate();
    const month = format(currentWeekStart, "MMMM", { locale: fr });
    const year = currentWeekStart.getFullYear();
    return `Semaine du ${day} ${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
  }, [currentWeekStart]);

  const getReservationsForDay = (dayIndex: number) =>
    reservations.filter((r) => r.dayIndex === dayIndex);

  return (
    <div className="reservation-glow-card overflow-hidden ">
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[hsl(220,13%,91%)] flex-wrap max-sm:gap-2 max-sm:px-3 ">
        <button 
          onClick={goToPrevWeek} 
          className="w-9 h-9 rounded-full border border-[hsl(220,13%,91%)] flex items-center justify-center hover:bg-[hsl(220,14%,96%)] transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-[hsl(220,20%,14%)]" />
        </button>
        <span className="text-sm font-semibold text-[hsl(220,20%,14%)] whitespace-nowrap">{weekLabel}</span>
        <button 
          onClick={goToNextWeek} 
          className="w-9 h-9 rounded-full border border-[hsl(220,13%,91%)] flex items-center justify-center hover:bg-[hsl(220,14%,96%)] transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-[hsl(220,20%,14%)]" />
        </button>
        <button 
          onClick={goToToday} 
          className="px-5 py-2 bg-[hsl(220,20%,14%)] text-white rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Aujourd'hui
        </button>
        <button className="w-9 h-9 rounded-lg border border-[hsl(220,13%,91%)] flex items-center justify-center hover:bg-[hsl(220,14%,96%)] transition-colors">
          <Calendar className="w-4 h-4 text-[hsl(220,20%,14%)]" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[hsl(220,13%,91%)] max-sm:grid-cols-[50px_repeat(7,1fr)]">
            <div />
            {weekDays.map((day, i) => (
              <div key={i} className="text-center py-3 border-l border-[hsl(220,13%,91%)]">
                <div className="text-xs font-semibold text-[hsl(220,9%,46%)] tracking-wider">{DAY_LABELS[i]}</div>
                <div className="text-lg font-bold text-[hsl(220,20%,14%)]">{day.getDate()}</div>
              </div>
            ))}
          </div>

          <div className="relative">
            {HOURS.map((hour) => (
              <div 
                key={hour} 
                className="grid grid-cols-[60px_repeat(7,1fr)] max-sm:grid-cols-[50px_repeat(7,1fr)]" 
                style={{ height: HOUR_HEIGHT }}
              >
                <div className="flex items-start justify-end pr-3 pt-0 text-sm font-semibold text-[hsl(220,9%,46%)]">
                  {String(hour).padStart(2, "0")}h
                </div>
                {Array.from({ length: 7 }, (_, i) => (
                  <div key={i} className="border-l border-t border-[hsl(220,13%,91%)] relative" />
                ))}
              </div>
            ))}

            {Array.from({ length: 7 }, (_, dayIndex) => {
              const dayReservations = getReservationsForDay(dayIndex);
              return dayReservations.map((res) => {
                const top = (res.startHour - HOURS[0]) * HOUR_HEIGHT;
                const height = res.duration * HOUR_HEIGHT;
                const hasOffset = res.colOffset !== undefined && res.colOffset > 0;
                const leftPercent = hasOffset ? 50 : 0;
                const widthPercent = hasOffset ? 50 : dayReservations.some(
                  (r) => r.id !== res.id && r.colOffset !== undefined && r.colOffset > 0 &&
                    ((r.startHour < res.startHour + res.duration && r.startHour + r.duration > res.startHour))
                ) ? 50 : 100;

                return (
                  <div
                    key={res.id}
                    className={`absolute rounded-lg ${colorMap[res.calendarColor]} px-1.5 py-1 text-xs font-semibold overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border border-white/30`}
                    style={{
                      top: `${top}px`,
                      height: `${height - 2}px`,
                      left: `calc(60px + (100% - 60px) / 7 * ${dayIndex} + (100% - 60px) / 7 * ${leftPercent / 100})`,
                      width: `calc((100% - 60px) / 7 * ${widthPercent / 100} - 4px)`,
                    }}
                    onClick={() => onSelectReservation(res)}
                  >
                    <span
                      style={res.duration >= 1.5 ? { writingMode: "vertical-rl", textOrientation: "mixed" } : {}}
                    >
                      {res.property}
                    </span>
                  </div>
                );
              });
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyCalendar;
