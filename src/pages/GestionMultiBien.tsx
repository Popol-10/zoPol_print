import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import SidebarNav from "@/components/SidebarNav";
import TopNav from "@/components/TopNav";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { loadMultiBienItems, saveMultiBienItems } from "@/lib/multiBienStore";

const ITEMS_STEP = 6;

const GestionMultiBien = () => {
  const [items, setItems] = useState(() => loadMultiBienItems());
  const [selectedProperty, setSelectedProperty] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [visibleCount, setVisibleCount] = useState(ITEMS_STEP);

  const propertyOptions = useMemo(
    () => Array.from(new Set(items.map((item) => item.property.replace("\n", " ")))),
    [items],
  );
  const cityOptions = useMemo(() => Array.from(new Set(items.map((item) => item.city))), [items]);
  const statusOptions = useMemo(() => Array.from(new Set(items.map((item) => item.status))), [items]);

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const propertyName = item.property.replace("\n", " ");
        const propertyMatch = selectedProperty === "all" || propertyName === selectedProperty;
        const cityMatch = selectedCity === "all" || item.city === selectedCity;
        const statusMatch = selectedStatus === "all" || item.status === selectedStatus;
        return propertyMatch && cityMatch && statusMatch;
      }),
    [items, selectedProperty, selectedCity, selectedStatus],
  );

  useEffect(() => {
    setVisibleCount(ITEMS_STEP);
  }, [selectedProperty, selectedCity, selectedStatus]);

  const handleDelete = (itemId: string) => {
    const next = items.filter((item) => item.id !== itemId);
    setItems(next);
    saveMultiBienItems(next);
  };

  return (
    <div className="page-shell flex min-h-screen bg-[#edeef7]">
      <SidebarNav />

      <main className="flex-1 min-w-0 p-3 pt-16 sm:p-4 sm:pt-16 lg:p-6 lg:pl-6 lg:pt-6">
        <div className="mx-auto w-full max-w-[1400px]">
          <TopNav title="GESTION MULTI-BIEN" userName="Mark Loren" />

          <section className="mt-7 flex flex-col gap-3 md:mt-8 md:gap-4 lg:mt-9 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between lg:gap-4">
            <div className="w-full rounded-2xl border border-[#d3d4dc] bg-[#f4f5f8] p-3 lg:w-auto">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-1 md:grid-cols-3 lg:flex lg:flex-nowrap lg:items-center lg:justify-start">
                <div className="relative h-[52px] w-full sm:h-[56px] md:min-w-0 lg:min-w-[200px]">
                  <select
                    value={selectedProperty}
                    onChange={(event) => setSelectedProperty(event.target.value)}
                    className="h-full w-full appearance-none rounded-xl bg-[#dce9f8] px-4 pr-10 text-[15px] font-semibold text-[#0a78f7] outline-none sm:px-6 sm:text-[16px]"
                  >
                    <option value="all">Tous les biens</option>
                    {propertyOptions.map((property) => (
                      <option key={property} value={property}>
                        {property}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#0a78f7]" />
                </div>
                <div className="relative h-[52px] w-full sm:h-[56px] md:min-w-0 lg:min-w-[200px]">
                  <select
                    value={selectedCity}
                    onChange={(event) => setSelectedCity(event.target.value)}
                    className="h-full w-full appearance-none rounded-xl bg-[#f7e5e1] px-4 pr-10 text-[15px] font-semibold text-[#f44720] outline-none sm:px-6 sm:text-[16px]"
                  >
                    <option value="all">Toutes les villes</option>
                    {cityOptions.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#f44720]" />
                </div>
                <div className="relative h-[52px] w-full sm:h-[56px] md:min-w-0 lg:min-w-[200px]">
                  <select
                    value={selectedStatus}
                    onChange={(event) => setSelectedStatus(event.target.value)}
                    className="h-full w-full appearance-none rounded-xl bg-[#e3e3e3] px-4 pr-10 text-[15px] font-semibold text-[#111111] outline-none sm:px-6 sm:text-[16px]"
                  >
                    <option value="all">Tous les statuts</option>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#111111]" />
                </div>
              </div>
            </div>

            <Link
              to="/gestion-multi-bien/detail"
              className="flex h-[52px] w-full items-center justify-center gap-3 rounded-xl bg-[#077bff] px-6 text-[15px] font-semibold text-white sm:h-[56px] sm:text-[16px] md:w-auto md:min-w-[205px] md:px-7"
            >
              <Plus className="h-5 w-5" />
              Ajouter des biens
            </Link>
          </section>

          <section className="mt-9">
            {filteredItems.slice(0, visibleCount).map((item) => (
              <article key={item.id} className="rounded-2xl border border-[#d1d2da] bg-[#f8f9fc] p-4 sm:p-4 md:p-5 lg:rounded-none lg:border-x-0 lg:border-t-0 lg:border-b lg:bg-transparent lg:px-0 lg:py-4">
                <div className="space-y-3 md:hidden">
                  <img
                    src={item.image}
                    alt={item.property.replace("\n", " ")}
                    className="h-[170px] w-full rounded-[10px] object-cover sm:h-[210px]"
                  />

                  <div className="rounded-xl bg-white px-4 py-3 text-center shadow-sm">
                    <p className="text-[14px] font-medium text-[#202020]">Propriété</p>
                    <h3 className="mt-2 whitespace-pre-line text-[16px] font-semibold leading-[1.2] text-[#101010] sm:text-[17px]">
                      {item.property}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-white px-3 py-3 text-center shadow-sm">
                      <p className="text-[13px] font-medium text-[#202020]">Ville</p>
                      <p className="mt-1 text-[14px] font-medium text-[#101010]">{item.city}</p>
                    </div>
                    <div className="rounded-xl bg-white px-3 py-3 text-center shadow-sm">
                      <p className="text-[13px] font-medium text-[#202020]">Statut</p>
                      <p className="mt-1 text-[14px] font-medium text-[#1bb348]">{item.status}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-white px-3 py-3 text-center shadow-sm">
                      <p className="text-[13px] font-medium text-[#202020]">Prix de base</p>
                      <p className="mt-1 text-[14px] font-medium text-[#101010]">{item.basePrice}</p>
                    </div>
                    <div className="rounded-xl bg-white px-3 py-3 text-center shadow-sm">
                      <p className="text-[13px] font-medium text-[#202020]">Taux d&apos;occupation</p>
                      <p className="mt-1 text-[14px] font-medium text-[#007bff]">{item.occupancy}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#d7d8df] bg-white px-4 py-3 text-center">
                    <p className="text-[13px] font-medium text-[#202020]">CA mensuelle</p>
                    <p className="mt-1 text-[16px] font-semibold text-[#101010]">{item.monthlyRevenue}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <Link
                        to="/gestion-multi-bien/detail"
                        state={{ itemId: item.id }}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#0f7cff] text-white"
                        aria-label={`Modifier ${item.property.replace("\n", " ")}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff226d] text-white"
                        aria-label={`Supprimer ${item.property.replace("\n", " ")}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="hidden items-center gap-4 md:grid md:grid-cols-2 lg:grid-cols-[100px_1.2fr_0.9fr_0.8fr_0.9fr_0.9fr_0.9fr_auto] lg:gap-4">
                  <img
                    src={item.image}
                    alt={item.property.replace("\n", " ")}
                    className="w-full rounded-[10px] object-cover md:col-span-2 md:h-[240px] lg:col-span-1 lg:h-[92px]"
                  />

                  <div className="text-left lg:text-center">
                    <p className="text-[14px] font-medium text-[#202020]">Propriété</p>
                    <h3 className="mt-2 whitespace-pre-line text-[16px] font-semibold leading-[1.2] text-[#101010]">
                      {item.property}
                    </h3>
                  </div>

                  <div className="text-left lg:text-center">
                    <p className="text-[14px] font-medium text-[#202020]">Ville</p>
                    <p className="mt-2 text-[15px] font-medium text-[#101010]">{item.city}</p>
                  </div>

                  <div className="text-left lg:text-center">
                    <p className="text-[14px] font-medium text-[#202020]">Statut</p>
                    <p className="mt-2 text-[15px] font-medium text-[#1bb348]">{item.status}</p>
                  </div>

                  <div className="text-left lg:text-center">
                    <p className="text-[14px] font-medium text-[#202020]">Prix de base</p>
                    <p className="mt-2 text-[15px] font-medium text-[#101010]">{item.basePrice}</p>
                  </div>

                  <div className="text-left lg:text-center">
                    <p className="text-[14px] font-medium text-[#202020]">Taux d&apos;occupation</p>
                    <p className="mt-2 text-[15px] font-medium text-[#007bff]">{item.occupancy}</p>
                  </div>

                  <div className="md:col-span-2 md:text-left lg:col-span-1 lg:text-center">
                    <p className="text-[14px] font-medium text-[#202020]">CA mensuelle</p>
                    <p className="mt-2 text-[15px] font-medium text-[#101010]">{item.monthlyRevenue}</p>
                  </div>

                  <div className="md:col-span-2 lg:col-span-1 lg:flex lg:justify-end">
                    <div className="inline-flex items-center gap-1.5">
                      <Link
                        to="/gestion-multi-bien/detail"
                        state={{ itemId: item.id }}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#0f7cff] text-white"
                        aria-label={`Modifier ${item.property.replace("\n", " ")}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff226d] text-white"
                        aria-label={`Supprimer ${item.property.replace("\n", " ")}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
            {filteredItems.length === 0 && (
              <div className="rounded-2xl border border-[#d1d2da] bg-white px-6 py-10 text-center text-[16px] text-[#3a3a3a]">
                Aucun bien ne correspond aux filtres sélectionnés.
              </div>
            )}
          </section>

          {visibleCount < filteredItems.length && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((current) => current + ITEMS_STEP)}
                className="flex h-[52px] w-full max-w-[320px] items-center justify-center gap-3 rounded-xl border border-[#bdbec5] bg-[#f1f2f7] text-[15px] font-semibold text-[#111111]"
              >
                Afficher plus
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default GestionMultiBien;
