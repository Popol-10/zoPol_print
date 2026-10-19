import { useState } from "react";
import { Plus } from "lucide-react";
import SidebarNav from "@/components/SidebarNav";
import TopNav from "@/components/TopNav";
import PropertyCard, { type Property } from "@/components/PropertyCard";
import Pagination from "@/components/Pagination";

import villa1 from "@/assets/villa1.png";
import villa2 from "@/assets/villa2.png";
import villa3 from "@/assets/villa3.png";
import villa4 from "@/assets/villa4.png";
import villa5 from "@/assets/villa5.png";
import villa6 from "@/assets/villa6.png";

/** Tags used across all property cards */
const TAGS = ["Formule nuit", "2 Heures", "3 Heures", "5 Heures", "6 Heures", "4 Heures"];

/** Mock property data matching the design */
const properties: Property[] = [
  { id: 1, name: "Appartement B", capacity: 5, images: [villa1, villa2, villa3], tags: TAGS, published: false },
  { id: 2, name: "Villa D", capacity: 6, images: [villa2, villa5, villa6], tags: TAGS, published: true },
  { id: 3, name: "Studio A", capacity: 10, images: [villa3, villa4, villa1], tags: TAGS, published: true },
  { id: 4, name: "Appartement A", capacity: 7, images: [villa4, villa6, villa2], tags: TAGS, published: false },
  { id: 5, name: "Studio B", capacity: 8, images: [villa5, villa1, villa3], tags: TAGS, published: true },
  { id: 6, name: "Villa E", capacity: 9, images: [villa6, villa3, villa4], tags: TAGS, published: false },
];

/** Mes Logements page — property listing grid with pagination */
const MesLogements = () => {
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav activePage="Mes Logements" />

      <main className="flex-1 flex flex-col gap-5 p-4 lg:p-6 pl-4 lg:pl-6 min-w-0 pt-16 lg:pt-6">
        {/* Top navigation with LOGEMENT title */}
        <TopNav title="LOGEMENT" />

        {/* CTA button */}
        <div className="flex justify-end">
          <button className="flex items-center gap-2 bg-foreground text-background font-semibold text-sm px-5 py-3 rounded-xl hover:opacity-90 transition-opacity shadow-md">
            <Plus className="h-4 w-4" />
            Créer un logement
          </button>
        </div>

        {/* Property cards grid — 1 col mobile, 2 cols tablet, 3 cols desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>

        {/* Pagination */}
        <Pagination currentPage={currentPage} totalPages={7} onPageChange={setCurrentPage} />
      </main>
    </div>
  );
};

export default MesLogements;
