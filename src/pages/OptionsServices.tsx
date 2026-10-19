import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import SidebarNav from "@/components/SidebarNav";
import TopNav from "@/components/TopNav";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import {
  type ExtraItem,
  type GiftCardItem,
  type PromoCodeItem,
  type TabKey,
  loadOptionsServicesData,
  saveOptionsServicesData,
} from "@/lib/optionsServicesStore";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "extra", label: "Extra" },
  { key: "promo", label: "Code Promo" },
  { key: "gift", label: "Bon cadeau" },
];

const OptionsServices = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const routeTab = (location.state as { tab?: TabKey } | null)?.tab;

  const initialData = loadOptionsServicesData();
  const [activeTab, setActiveTab] = useState<TabKey>(routeTab ?? "extra");
  const [extraItems, setExtraItems] = useState<ExtraItem[]>(initialData.extras);
  const [promoItems, setPromoItems] = useState<PromoCodeItem[]>(initialData.promoCodes);
  const [giftItems, setGiftItems] = useState<GiftCardItem[]>(initialData.giftCards);

  useEffect(() => {
    if (!routeTab) return;
    setActiveTab(routeTab);
  }, [routeTab]);

  useEffect(() => {
    saveOptionsServicesData({
      extras: extraItems,
      promoCodes: promoItems,
      giftCards: giftItems,
    });
  }, [extraItems, promoItems, giftItems]);

  const deleteExtra = (id: string) => {
    const canDelete = window.confirm("Supprimer cet extra ?");
    if (!canDelete) return;
    setExtraItems((prev) => prev.filter((item) => item.id !== id));
    toast({ title: "Extra supprime" });
  };

  const deletePromo = (id: string) => {
    const canDelete = window.confirm("Supprimer ce code promo ?");
    if (!canDelete) return;
    setPromoItems((prev) => prev.filter((item) => item.id !== id));
    toast({ title: "Code promo supprime" });
  };

  const togglePromoActive = (id: string) => {
    setPromoItems((prev) => prev.map((item) => (item.id === id ? { ...item, actif: !item.actif } : item)));
  };

  const deleteGift = (id: string) => {
    const canDelete = window.confirm("Supprimer ce bon cadeau ?");
    if (!canDelete) return;
    setGiftItems((prev) => prev.filter((item) => item.id !== id));
    toast({ title: "Bon cadeau supprime" });
  };

  const toggleGiftActive = (id: string) => {
    setGiftItems((prev) => prev.map((item) => (item.id === id ? { ...item, actif: !item.actif } : item)));
  };

  return (
    <div className="page-shell flex min-h-screen bg-background">
      <SidebarNav />

      <main className="flex min-w-0 flex-1 flex-col gap-5 p-4 pb-8 pt-16 lg:gap-6 lg:p-6 lg:pt-6">
        <TopNav title="OPTIONS SERVICES" />

        <section className="mx-auto w-full max-w-[1120px] space-y-10">
          <h2 className="text-center text-xl font-bold tracking-tight text-[#17171b] lg:text-2xl">GERER LES OPTIONS</h2>

          <div className="mx-auto w-full max-w-[550px] rounded-[22px] border border-[#d2d2d7] bg-white p-[10px] shadow-[0_28px_65px_-22px_rgba(82,96,255,0.36)]">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`h-[50px] rounded-[14px] text-lg font-semibold tracking-[-0.01em] transition-all duration-200 md:text-[15px] ${
                      isActive
                        ? "bg-[#187ff2] text-white shadow-[0_2px_4px_rgba(0,0,0,0.14)] hover:brightness-110"
                        : "bg-[#dddddf] text-[#18181d] shadow-[inset_0_2px_2px_rgba(0,0,0,0.15)] hover:bg-[#d8d8db]"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {activeTab === "extra" ? (
            <>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {extraItems.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[26px] border border-[#d4d4da] bg-[#f4f4f6] p-4 shadow-[0_28px_65px_-22px_rgba(82,96,255,0.34)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_30px_70px_-24px_rgba(82,96,255,0.42)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <img src={item.image} alt={item.title} className="h-[126px] w-[250px] rounded-[14px] object-cover" />
                      <p className="pr-4 text-xl font-bold leading-none text-[#111116] lg:text-xl">{item.price}</p>
                    </div>

                    <div className="mt-4">
                      <h3 className="text-xl font-semibold text-[#17171c] lg:text-[15px]">{item.title}</h3>
                      <p className="mt-1 text-sm italic text-[#77777d] lg:text-[15px]">{item.description}</p>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                      <span className="inline-flex h-8 min-w-[100px] items-center justify-center rounded-full border border-[#7a7a7e] bg-[#9a9a9f] px-4 text-xs text-white lg:text-sm">
                        {item.category}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate("/options-services/extra", { state: { mode: "edit", itemId: item.id } })}
                          className="inline-flex h-10 min-w-[100px] items-center justify-center gap-2 rounded-xl bg-[#26b33e] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1d9f36]"
                        >
                          <Pencil className="h-4 w-4" />
                          Editer
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteExtra(item.id)}
                          className="inline-flex h-10 min-w-[100px] items-center justify-center gap-2 rounded-xl bg-[#f91711] px-2 text-sm font-semibold text-white transition-colors hover:bg-[#d60f0a]"
                        >
                          <Trash2 className="h-4 w-4" />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {extraItems.length === 0 ? (
                <p className="text-center text-[15px] text-[#5a5a62]">Aucun extra disponible pour le moment.</p>
              ) : null}

              <div className="pt-20 text-center">
                <button
                  type="button"
                  onClick={() => navigate("/options-services/extra", { state: { mode: "add" } })}
                  className="inline-flex h-12 min-w-[270px] items-center justify-center gap-3 rounded-xl bg-[#0f7bf1] px-8 text-base font-semibold text-white transition-colors hover:bg-[#0c69cf] lg:min-w-[300px] lg:text-[17px]"
                >
                  Ajouter un extra
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : activeTab === "promo" ? (
            <>
              <div className="rounded-[20px] border border-[#d3d3d9] bg-[#f4f4f6] p-3 shadow-[0_30px_70px_-24px_rgba(82,96,255,0.34)] lg:p-4">
                <div className="overflow-x-auto">
                  <table className="min-w-[920px] w-full">
                    <thead>
                      <tr className="border-b border-[#dbdbe1] text-left">
                        <th className="px-4 py-4 text-[15px] font-semibold text-[#18181d]">Code</th>
                        <th className="px-4 py-4 text-[15px] font-semibold text-[#18181d]">Valeur</th>
                        <th className="px-4 py-4 text-[15px] font-semibold text-[#18181d]">Nombre de commande</th>
                        <th className="px-4 py-4 text-[15px] font-semibold text-[#18181d]">Utilisations</th>
                        <th className="px-4 py-4 text-[15px] font-semibold text-[#18181d]">Dates</th>
                        <th className="px-4 py-4 text-[15px] font-semibold text-[#18181d]">Actif</th>
                        <th className="px-4 py-4 text-[15px] font-semibold text-[#18181d]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {promoItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-5 text-[15px] font-semibold text-[#1b1b21]">{item.code}</td>
                          <td className="px-4 py-5 text-[15px] font-semibold text-[#1b1b21]">{item.valeur}</td>
                          <td className="px-4 py-5 text-[15px] font-semibold text-[#1b1b21]">{item.commandes}</td>
                          <td className="px-4 py-5 text-[15px] font-semibold text-[#1b1b21]">{item.utilisations}</td>
                          <td className="px-4 py-5 text-[15px] font-semibold text-[#1b1b21]">{item.date}</td>
                          <td className="px-4 py-5">
                            <button
                              type="button"
                              onClick={() => togglePromoActive(item.id)}
                              className="relative h-6 w-10 rounded-full bg-[#d5d5da] p-0.5"
                              aria-label="Activer ou désactiver"
                            >
                              <span
                                className={`block h-5 w-5 rounded-full bg-[#0f7bf1] transition-transform ${
                                  item.actif ? "translate-x-4" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </td>
                          <td className="px-4 py-5">
                            <div className="flex items-center gap-4">
                              <button
                                type="button"
                                onClick={() => navigate("/options-services/code-promo", { state: { mode: "edit", itemId: item.id } })}
                                className="text-[#0f7bf1] transition-colors hover:text-[#0c69cf]"
                                aria-label="Modifier"
                              >
                                <Pencil className="h-5 w-5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deletePromo(item.id)}
                                className="text-[#ff0000] transition-colors hover:text-[#d10a0a]"
                                aria-label="Supprimer"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {promoItems.length === 0 ? (
                <p className="text-center text-[15px] text-[#5a5a62]">Aucun code promo disponible pour le moment.</p>
              ) : null}

              <div className="pt-16 text-center">
                <button
                  type="button"
                  onClick={() => navigate("/options-services/code-promo", { state: { mode: "add" } })}
                  className="inline-flex h-12 min-w-[270px] items-center justify-center gap-3 rounded-xl bg-[#0f7bf1] px-8 text-base font-semibold text-white transition-colors hover:bg-[#0c69cf] lg:min-w-[300px] lg:text-[17px]"
                >
                  Ajouter un code promo
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-[20px] border border-[#d3d3d9] bg-[#f4f4f6] p-3 shadow-[0_30px_70px_-24px_rgba(82,96,255,0.34)] lg:p-4">
                <div className="overflow-x-auto">
                  <table className="min-w-[920px] w-full">
                    <thead>
                      <tr className="border-b border-[#dbdbe1] text-left">
                        <th className="px-4 py-4 text-[15px] font-semibold text-[#18181d]">Code</th>
                        <th className="px-4 py-4 text-[15px] font-semibold text-[#18181d]">Montant</th>
                        <th className="px-4 py-4 text-[15px] font-semibold text-[#18181d]">Solde restant</th>
                        <th className="px-4 py-4 text-[15px] font-semibold text-[#18181d]">Utilisations</th>
                        <th className="px-4 py-4 text-[15px] font-semibold text-[#18181d]">Dates</th>
                        <th className="px-4 py-4 text-[15px] font-semibold text-[#18181d]">Actif</th>
                        <th className="px-4 py-4 text-[15px] font-semibold text-[#18181d]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {giftItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-5 text-[15px] font-semibold text-[#1b1b21]">{item.code}</td>
                          <td className="px-4 py-5 text-[15px] font-semibold text-[#1b1b21]">{item.montant}</td>
                          <td className="px-4 py-5 text-[15px] font-semibold text-[#1b1b21]">{item.soldeRestant}</td>
                          <td className="px-4 py-5 text-[15px] font-semibold text-[#1b1b21]">{item.utilisations}</td>
                          <td className="px-4 py-5 text-[15px] font-semibold text-[#1b1b21]">{item.date}</td>
                          <td className="px-4 py-5">
                            <button
                              type="button"
                              onClick={() => toggleGiftActive(item.id)}
                              className="relative h-6 w-10 rounded-full bg-[#d5d5da] p-0.5"
                              aria-label="Activer ou désactiver"
                            >
                              <span
                                className={`block h-5 w-5 rounded-full bg-[#0f7bf1] transition-transform ${
                                  item.actif ? "translate-x-4" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </td>
                          <td className="px-4 py-5">
                            <div className="flex items-center gap-4">
                              <button
                                type="button"
                                onClick={() => navigate("/options-services/bon-cadeau", { state: { mode: "edit", itemId: item.id } })}
                                className="text-[#0f7bf1] transition-colors hover:text-[#0c69cf]"
                                aria-label="Modifier"
                              >
                                <Pencil className="h-5 w-5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteGift(item.id)}
                                className="text-[#ff0000] transition-colors hover:text-[#d10a0a]"
                                aria-label="Supprimer"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {giftItems.length === 0 ? (
                <p className="text-center text-[15px] text-[#5a5a62]">Aucun bon cadeau disponible pour le moment.</p>
              ) : null}

              <div className="pt-16 text-center">
                <button
                  type="button"
                  onClick={() => navigate("/options-services/bon-cadeau", { state: { mode: "add" } })}
                  className="inline-flex h-12 min-w-[270px] items-center justify-center gap-3 rounded-xl bg-[#0f7bf1] px-8 text-base font-semibold text-white transition-colors hover:bg-[#0c69cf] lg:min-w-[300px] lg:text-[17px]"
                >
                  Ajouter un bon cadeau
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default OptionsServices;
