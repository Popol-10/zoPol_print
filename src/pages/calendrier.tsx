import { useCallback, useEffect, useMemo, useState } from "react";
import SidebarNav from "@/components/SidebarNav";
import TopNav from "@/components/TopNav";
import PropertyListSidebar, { properties } from "@/components/PropertyListSidebar";
import CalendarGrid, { type CalendarDay, type CalendarEvent } from "@/components/CalendarGrid";
import CalendarRightPanel, { type CalendarSelectionSettings } from "@/components/CalendarRightPanel";

const toDateKey = (year: number, monthIndex: number, day: number) =>
  `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const capitalize = (text: string) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text);

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const buildMonthDays = (monthDate: Date): CalendarDay[] => {
  const year = monthDate.getFullYear();
  const monthIndex = monthDate.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, idx) => {
    const day = idx + 1;
    const date = new Date(year, monthIndex, day);
    const dayName = capitalize(
      new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(date).replace(".", "")
    );

    return {
      key: toDateKey(year, monthIndex, day),
      date: day,
      dayName,
    };
  });
};

const buildMonthPrices = (days: CalendarDay[]) =>
  properties.reduce(
    (acc, property, propIndex) => {
      const prices: Record<string, string> = {};
      days.forEach((day, dayIndex) => {
        prices[day.key] = `${40 + ((dayIndex + propIndex * 3) % 15)}€`;
      });
      acc[property.id] = prices;
      return acc;
    },
    {} as Record<string, Record<string, string>>
  );

const buildMonthEvents = (monthDate: Date): CalendarEvent[] => {
  const year = monthDate.getFullYear();
  const monthIndex = monthDate.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const dayKey = (day: number) => toDateKey(year, monthIndex, Math.max(1, Math.min(day, daysInMonth)));

  return [
    {
      id: `ev-${year}-${monthIndex + 1}-1`,
      propertyId: "1",
      startDay: dayKey(2),
      endDay: dayKey(4),
      guestName: "Lucie Blare",
      type: "blocked",
    },
    {
      id: `ev-${year}-${monthIndex + 1}-2`,
      propertyId: "2",
      startDay: dayKey(6),
      endDay: dayKey(8),
      guestName: "Gerald FT",
      type: "blocked",
    },
    {
      id: `ev-${year}-${monthIndex + 1}-3`,
      propertyId: "3",
      startDay: dayKey(10),
      endDay: dayKey(12),
      guestName: "Robert Val",
      type: "blocked",
    },
    {
      id: `ev-${year}-${monthIndex + 1}-4`,
      propertyId: "4",
      startDay: dayKey(5),
      endDay: dayKey(5),
      guestName: "Maintenance",
      type: "blocked",
    },
  ];
};

const getInitialSelectableDay = (monthDate: Date, today: Date) => {
  const year = monthDate.getFullYear();
  const monthIndex = monthDate.getMonth();
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex + 1, 0);

  if (monthEnd < today) return "";
  if (monthStart < currentMonthStart) return "";
  if (year === today.getFullYear() && monthIndex === today.getMonth()) {
    return toDateKey(year, monthIndex, today.getDate());
  }

  return toDateKey(year, monthIndex, 1);
};

const defaultSelectionSettings = (): CalendarSelectionSettings => ({
  availability: "available",
  minHours: 1,
  maxHours: 10,
  closeArrival: false,
  closeDeparture: false,
});

const Calendrier = () => {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const days = useMemo(() => buildMonthDays(visibleMonth), [visibleMonth]);
  const pricesByProperty = useMemo(() => buildMonthPrices(days), [days]);
  const monthLabel = useMemo(
    () => capitalize(new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(visibleMonth)),
    [visibleMonth]
  );
  const todayKey = useMemo(
    () => toDateKey(today.getFullYear(), today.getMonth(), today.getDate()),
    [today]
  );

  const [selectedDay, setSelectedDay] = useState<string>(() => getInitialSelectableDay(visibleMonth, today));
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [events, setEvents] = useState<CalendarEvent[]>(() => buildMonthEvents(visibleMonth));
  const [settingsBySelection, setSettingsBySelection] = useState<Record<string, CalendarSelectionSettings>>({});
  const [showRightPanel, setShowRightPanel] = useState(false);

  useEffect(() => {
    setSelectedDay(getInitialSelectableDay(visibleMonth, today));
    setSelectedPropertyId(null);
    setEvents(buildMonthEvents(visibleMonth));
  }, [visibleMonth, today]);

  const isDayDisabled = useCallback((dayKey: string) => dayKey < todayKey, [todayKey]);

  const dayIndex = useCallback((dayKey: string) => days.findIndex((d) => d.key === dayKey), [days]);

  const isDayInRange = useCallback(
    (dayKey: string, startDay: string, endDay: string) => {
      const day = dayIndex(dayKey);
      const start = dayIndex(startDay);
      const end = dayIndex(endDay);
      if (day < 0 || start < 0 || end < 0) return false;
      return day >= start && day <= end;
    },
    [dayIndex]
  );

  const getStatusForDay = useCallback(
    (propertyId: string, dayKey: string): "available" | "reserved" | "blocked" => {
      const propertyEvents = events.filter((event) => event.propertyId === propertyId);

      const hasReserved = propertyEvents.some(
        (event) => event.type === "reserved" && isDayInRange(dayKey, event.startDay, event.endDay)
      );
      if (hasReserved) return "reserved";

      const hasBlocked = propertyEvents.some(
        (event) => event.type === "blocked" && isDayInRange(dayKey, event.startDay, event.endDay)
      );
      if (hasBlocked) return "blocked";

      return "available";
    },
    [events, isDayInRange]
  );

  const filteredProperties = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return properties;
    return properties.filter(
      (property) =>
        property.name.toLowerCase().includes(query) || property.address.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  useEffect(() => {
    if (!selectedPropertyId) return;
    const stillVisible = filteredProperties.some((property) => property.id === selectedPropertyId);
    if (!stillVisible) setSelectedPropertyId(null);
  }, [filteredProperties, selectedPropertyId]);

  const availableIds = useMemo(
    () =>
      selectedDay
        ? filteredProperties.filter((p) => getStatusForDay(p.id, selectedDay) === "available").map((p) => p.id)
        : [],
    [selectedDay, getStatusForDay, filteredProperties]
  );

  const reservedIds = useMemo(
    () =>
      selectedDay
        ? filteredProperties.filter((p) => getStatusForDay(p.id, selectedDay) === "reserved").map((p) => p.id)
        : [],
    [selectedDay, getStatusForDay, filteredProperties]
  );

  const blockedIds = useMemo(
    () =>
      selectedDay
        ? filteredProperties.filter((p) => getStatusForDay(p.id, selectedDay) === "blocked").map((p) => p.id)
        : [],
    [selectedDay, getStatusForDay, filteredProperties]
  );

  const selectedProperty = useMemo(
    () => filteredProperties.find((property) => property.id === selectedPropertyId) ?? null,
    [selectedPropertyId, filteredProperties]
  );

  const selectedPropertyStatus = useMemo(() => {
    if (!selectedPropertyId || !selectedDay) return null;
    return getStatusForDay(selectedPropertyId, selectedDay);
  }, [selectedPropertyId, selectedDay, getStatusForDay]);

  const selectedSettingsKey = useMemo(() => {
    if (!selectedPropertyId || !selectedDay) return null;
    return `${selectedPropertyId}::${selectedDay}`;
  }, [selectedPropertyId, selectedDay]);

  const selectedSettings = useMemo(() => {
    if (!selectedSettingsKey) return defaultSelectionSettings();
    const stored = settingsBySelection[selectedSettingsKey];
    if (!stored) {
      return {
        ...defaultSelectionSettings(),
        availability: selectedPropertyStatus === "blocked" ? "blocked" : "available",
      };
    }
    return stored;
  }, [selectedSettingsKey, settingsBySelection, selectedPropertyStatus]);

  const selectedDayLabel = useMemo(() => {
    if (!selectedDay) return "Aucune date sélectionnée";
    const [year, month, day] = selectedDay.split("-");
    if (!year || !month || !day) return "Aucune date sélectionnée";
    return `${day}/${month}/${year}`;
  }, [selectedDay]);

  const addEvent = (event: Omit<CalendarEvent, "id">) => {
    setEvents((prev) => [
      ...prev,
      {
        ...event,
        id: `${event.type}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      },
    ]);
  };

  const handleBlockSelected = () => {
    if (!selectedPropertyId || !selectedDay || isDayDisabled(selectedDay)) return;
    if (getStatusForDay(selectedPropertyId, selectedDay) !== "available") return;

    addEvent({
      propertyId: selectedPropertyId,
      startDay: selectedDay,
      endDay: selectedDay,
      guestName: "Maintenance",
      type: "blocked",
    });
  };

  const handleUnblockSelected = () => {
    if (!selectedPropertyId || !selectedDay || isDayDisabled(selectedDay)) return;

    setEvents((prev) =>
      prev.filter(
        (event) =>
          !(
            event.propertyId === selectedPropertyId &&
            event.type === "blocked" &&
            isDayInRange(selectedDay, event.startDay, event.endDay)
          )
      )
    );
  };

  const handleSelectProperty = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    if (selectedDay) setShowRightPanel(true);
  };

  const handleSelectDay = (dayKey: string) => {
    if (isDayDisabled(dayKey)) return;
    setSelectedDay(dayKey);
    setShowRightPanel(true);
  };

  const handlePreviousMonth = () => {
    setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleResetToCurrentMonth = () => {
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDay(todayKey);
    setShowRightPanel(false);
  };

  const handleSaveSettings = (settings: CalendarSelectionSettings) => {
    if (!selectedPropertyId || !selectedDay || !selectedSettingsKey || isDayDisabled(selectedDay)) return;

    setSettingsBySelection((prev) => ({
      ...prev,
      [selectedSettingsKey]: settings,
    }));

    const shouldBlock = settings.availability === "blocked" || settings.closeArrival || settings.closeDeparture;
    if (shouldBlock) {
      handleBlockSelected();
      return;
    }
    handleUnblockSelected();
  };

  return (
    <div className="page-shell flex min-h-screen bg-background">
      <SidebarNav />

      <main className="flex min-w-0 flex-1 flex-col gap-5 p-4 pb-8 pt-16 lg:gap-6 lg:p-6 lg:pt-6">
        <TopNav title="CALENDRIER" />

        <section className="px-1 lg:px-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-[28px] font-bold tracking-tight text-foreground">Mes calendriers</h2>
          </div>

          <div className="flex flex-col gap-4 xl:flex-row xl:gap-5">
            <div className="w-full flex-shrink-0 xl:w-[320px]">
              <div className="rounded-2xl border border-[#d1d1d6] bg-[#f6f6f8] p-4">
                <PropertyListSidebar
                  properties={filteredProperties}
                  monthLabel={monthLabel}
                  onPreviousMonth={handlePreviousMonth}
                  onNextMonth={handleNextMonth}
                  onResetToCurrentMonth={handleResetToCurrentMonth}
                  searchQuery={searchQuery}
                  onSearchQueryChange={setSearchQuery}
                  selectedPropertyId={selectedPropertyId}
                  selectedDayLabel={selectedDayLabel}
                  availableIds={availableIds}
                  reservedIds={reservedIds}
                  blockedIds={blockedIds}
                  getStatusForDay={(propertyId) =>
                    selectedDay ? getStatusForDay(propertyId, selectedDay) : "available"
                  }
                  onSelectProperty={handleSelectProperty}
                />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <CalendarGrid
                properties={filteredProperties}
                days={days}
                monthLabel={monthLabel}
                selectedDay={selectedDay}
                selectedPropertyId={selectedPropertyId}
                events={events}
                pricesByProperty={pricesByProperty}
                getStatusForDay={getStatusForDay}
                isDayDisabled={isDayDisabled}
                onSelectDay={handleSelectDay}
                onSelectProperty={handleSelectProperty}
              />
            </div>

            {showRightPanel ? (
              <div className="w-full flex-shrink-0 xl:w-[300px]">
                <CalendarRightPanel
                  selectedDayLabel={selectedDayLabel}
                  selectedProperty={selectedProperty}
                  selectedPropertyStatus={selectedPropertyStatus}
                  isSelectionInPast={!selectedDay || isDayDisabled(selectedDay)}
                  initialSettings={selectedSettings}
                  onSaveSettings={handleSaveSettings}
                  onClose={() => setShowRightPanel(false)}
                />
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Calendrier;
