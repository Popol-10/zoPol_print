import { User } from "lucide-react";
import type { Property } from "./PropertyListSidebar";

export interface CalendarDay {
  key: string;
  date: number;
  dayName: string;
}

export interface CalendarEvent {
  id: string;
  propertyId: string;
  startDay: string;
  endDay: string;
  guestName: string;
  type: "reserved" | "blocked";
}

interface CalendarGridProps {
  properties: Property[];
  days: CalendarDay[];
  monthLabel: string;
  selectedDay: string;
  selectedPropertyId: string | null;
  events: CalendarEvent[];
  pricesByProperty: Record<string, Record<string, string>>;
  getStatusForDay: (propertyId: string, dayKey: string) => "available" | "reserved" | "blocked";
  isDayDisabled: (dayKey: string) => boolean;
  onSelectDay: (dayKey: string) => void;
  onSelectProperty: (propertyId: string) => void;
}

const CalendarGrid = ({
  properties,
  days,
  monthLabel,
  selectedDay,
  selectedPropertyId,
  events,
  pricesByProperty,
  getStatusForDay,
  isDayDisabled,
  onSelectDay,
  onSelectProperty,
}: CalendarGridProps) => {
  const dayIndex = (dayKey: string) => days.findIndex((d) => d.key === dayKey);
  const gridTemplate = { gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` };
  const minGridWidth = Math.max(days.length * 108, 760);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#d1d1d6] bg-[#fff]">
      <div className="border-b border-[#d8d8dc] px-6 py-4">
        <h3 className="text-[18px] font-bold text-[#161618]">{monthLabel}</h3>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: `${minGridWidth}px` }}>
          <div className="grid border-b border-[#d8d8dc]" style={gridTemplate}>
            {days.map((day) => {
              const isSelected = day.key === selectedDay;
              const isDisabled = isDayDisabled(day.key);
              return (
                <button
                  key={day.key}
                  onClick={() => onSelectDay(day.key)}
                  disabled={isDisabled}
                  className={`flex h-24 flex-col items-center justify-center border-r border-[#d8d8dc] text-center transition-colors last:border-r-0 ${
                    isSelected ? "bg-[#f0d9e4]" : "bg-[#f6f6f8]"
                  } ${
                    isDisabled ? "cursor-not-allowed opacity-40" : "hover:bg-[#efeff3]"
                  }`}
                >
                  <span className={`text-[18px] font-semibold ${isSelected ? "text-primary" : "text-[#161618]"}`}>
                    {day.date < 10 ? `0${day.date}` : day.date}
                  </span>
                  <span className={`text-[14px] font-medium ${isSelected ? "text-primary" : "text-[#57575d]"}`}>
                    {day.dayName}
                  </span>
                </button>
              );
            })}
          </div>

          {properties.map((property) => {
            const propertyEvents = events.filter((event) => event.propertyId === property.id);
            const isSelectedProperty = selectedPropertyId === property.id;

            return (
              <div
                key={property.id}
                className={`relative grid border-b border-[#d8d8dc] ${
                  isSelectedProperty ? "ring-2 ring-inset ring-[#2f82f6]/35" : ""
                }`}
                style={gridTemplate}
              >
                {days.map((day) => {
                  const status = getStatusForDay(property.id, day.key);
                  const isActiveDay = day.key === selectedDay;
                  const isDisabled = isDayDisabled(day.key);
                  const price = pricesByProperty[property.id]?.[day.key] ?? "";

                  return (
                    <button
                      key={`${property.id}-${day.key}`}
                      onClick={() => {
                        onSelectDay(day.key);
                        onSelectProperty(property.id);
                      }}
                      disabled={isDisabled}
                      className={`relative flex h-[62px] flex-col items-center justify-center border-r border-[#d8d8dc] text-[13px] font-medium last:border-r-0 ${
                        isActiveDay ? "bg-[#eef4ff]" : ""
                      } ${
                        status === "reserved"
                          ? "bg-[#eceff3] text-[#8c96a3]"
                          : status === "blocked"
                            ? "bg-[#fff0f5] text-[#8a4b60]"
                            : "text-[#222226]"
                      } ${
                        isDisabled ? "cursor-not-allowed opacity-40" : ""
                      }`}
                    >
                      {price ? <span className="relative z-20">{price}</span> : null}
                      {status === "reserved" ? (
                        <span className="relative z-20 mt-0.5 rounded-full bg-[#d3d8df] px-2 py-0.5 text-[10px] font-semibold text-[#4e5b6b]">
                          Reserve
                        </span>
                      ) : null}
                      {status === "blocked" ? (
                        <span className="relative z-20 mt-0.5 rounded-full bg-[#ffdbe8] px-2 py-0.5 text-[10px] font-semibold text-[#ba215f]">
                          Bloque
                        </span>
                      ) : null}
                    </button>
                  );
                })}

                {propertyEvents.map((event) => {
                  const start = dayIndex(event.startDay);
                  const end = dayIndex(event.endDay);
                  if (start < 0 || end < 0 || end < start) return null;

                  const left = (start / days.length) * 100;
                  const width = ((end - start + 1) / days.length) * 100;
                  const eventBg = event.type === "reserved" ? property.colorHex : `${property.colorHex}88`;

                  return (
                    <button
                      key={event.id}
                      onClick={() => {
                        onSelectProperty(property.id);
                        onSelectDay(event.startDay);
                      }}
                      disabled={isDayDisabled(event.startDay)}
                      className={`absolute left-0 top-[7px] z-10 flex h-12 items-center rounded-full pl-2 text-left text-white ${
                        isDayDisabled(event.startDay) ? "cursor-not-allowed opacity-50" : ""
                      }`}
                      style={{ left: `${left}%`, width: `${width}%`, backgroundColor: eventBg }}
                    >
                      <User className="mr-2 h-5 w-5 flex-shrink-0" />
                      <span className="truncate text-[12px] italic leading-tight">
                        {event.type === "blocked" ? "Maintenance" : event.guestName}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarGrid;
