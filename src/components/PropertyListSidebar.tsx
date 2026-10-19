import { CalendarIcon, MapPin, ChevronLeft, ChevronRight, Search } from "lucide-react";

const property1 = "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=150&h=150&fit=crop";
const property2 = "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=150&h=150&fit=crop";
const property3 = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=150&h=150&fit=crop";
const property4 = "https://images.unsplash.com/photo-1560185007-c5ca9d2c045d?w=150&h=150&fit=crop";

export interface Property {
  id: string;
  name: string;
  address: string;
  image: string;
  colorHex: string;
}

export const properties: Property[] = [
  {
    id: "1",
    name: "Residence Lorem ipsum",
    address: "Rue 5 eme Avenue, 102 Dolor Sit",
    image: property1,
    colorHex: "#007BFF",
  },
  {
    id: "2",
    name: "Villa Nunc Per Velit",
    address: "45e Avenue, 102 Dolor Sit",
    image: property2,
    colorHex: "#FF226D",
  },
  {
    id: "3",
    name: "Studio Amet",
    address: "Rue 5 102 Dolor Sit",
    image: property3,
    colorHex: "#FB3816",
  },
  {
    id: "4",
    name: "Residence Lorem ipsum",
    address: "Rue 5 eme Avenue, 102 Dolor Sit",
    image: property4,
    colorHex: "#1FAF38",
  },
];

interface PropertyListSidebarProps {
  className?: string;
  properties: Property[];
  monthLabel: string;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onResetToCurrentMonth: () => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  selectedPropertyId: string | null;
  selectedDayLabel: string;
  availableIds: string[];
  reservedIds: string[];
  blockedIds: string[];
  getStatusForDay: (propertyId: string) => "available" | "reserved" | "blocked";
  onSelectProperty: (propertyId: string) => void;
}

const PropertyListSidebar = ({
  className,
  properties,
  monthLabel,
  onPreviousMonth,
  onNextMonth,
  onResetToCurrentMonth,
  searchQuery,
  onSearchQueryChange,
  selectedPropertyId,
  selectedDayLabel,
  availableIds,
  reservedIds,
  blockedIds,
  getStatusForDay,
  onSelectProperty,
}: PropertyListSidebarProps) => {
  return (
    <div className={`space-y-4 ${className ?? ""}`}>
      <div className="flex w-full items-center gap-2 rounded-xl border border-gray-200 px-2 py-2">
        <button
          type="button"
          onClick={onPreviousMonth}
          className="grid h-8 w-8 place-items-center rounded-lg text-gray-700 transition-colors hover:bg-gray-100"
          aria-label="Mois précédent"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="flex-1 text-center text-[14px] font-semibold text-gray-900">{monthLabel}</span>
        <button
          type="button"
          onClick={onNextMonth}
          className="grid h-8 w-8 place-items-center rounded-lg text-gray-700 transition-colors hover:bg-gray-100"
          aria-label="Mois suivant"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5">
          <Search className="h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Rechercher propriete"
            className="flex-1 bg-transparent text-[13px] text-gray-800 outline-none placeholder:text-gray-500"
            aria-label="Recherche propriété"
          />
        </div>
        <button
          type="button"
          onClick={onResetToCurrentMonth}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
          title="Revenir au mois courant"
          aria-label="Revenir au mois courant"
        >
          <CalendarIcon className="h-4 w-4 text-gray-900" />
        </button>
      </div>

      <div className="space-y-3">
        {properties.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-3 py-5 text-center text-[13px] text-gray-600">
            Aucune propriete trouvee
          </div>
        ) : null}

        {properties.map((prop) => {
          const status = getStatusForDay(prop.id);
          const isSelected = selectedPropertyId === prop.id;
          return (
            <button
              key={prop.id}
              onClick={() => onSelectProperty(prop.id)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                isSelected ? "border-[#2f82f6] bg-[#eef4ff]" : "border-transparent bg-white hover:border-gray-200"
              }`}
            >
              <img src={prop.image} alt={prop.name} className="h-16 w-16 flex-shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-gray-900">{prop.name}</p>
                <div className="mt-1 flex items-start gap-1">
                  <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0 text-gray-500" />
                  <span className="line-clamp-2 text-[11px] leading-tight text-gray-500">{prop.address}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: prop.colorHex }} />
                  <span className="text-[11px] font-semibold text-gray-900">{prop.colorHex}</span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    status === "available"
                      ? "bg-green-100 text-green-700"
                      : status === "reserved"
                        ? "bg-slate-200 text-slate-700"
                        : "bg-pink-100 text-pink-700"
                  }`}
                >
                  {status === "available" ? "Disponible" : status === "reserved" ? "Reserve" : "Bloque"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-3">
        <p className="text-[12px] font-semibold text-gray-900">Date: {selectedDayLabel}</p>
        <p className="mt-2 text-[12px] text-green-700">Disponibles: {availableIds.length}</p>
        <p className="text-[12px] text-slate-700">Reserves: {reservedIds.length}</p>
        <p className="text-[12px] text-pink-700">Bloques: {blockedIds.length}</p>
      </div>
    </div>
  );
};

export default PropertyListSidebar;
