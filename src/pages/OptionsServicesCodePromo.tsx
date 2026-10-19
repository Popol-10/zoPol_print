import { useRef, useState } from "react";
import { CalendarDays, ChevronsUpDown, Plus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import SidebarNav from "@/components/SidebarNav";
import TopNav from "@/components/TopNav";
import { toast } from "@/components/ui/use-toast";
import {
  formatIsoDateToFrench,
  loadOptionsServicesData,
  parseFrenchDateToIso,
  saveOptionsServicesData,
} from "@/lib/optionsServicesStore";

interface PromoState {
  mode?: "add" | "edit";
  itemId?: string;
  item?: {
    id?: string;
    code?: string;
    valeur?: string;
    commandes?: number;
    utilisations?: number;
    date?: string;
    actif?: boolean;
  };
}

const OptionsServicesCodePromo = () => {
  type DatePickerInput = HTMLInputElement & { showPicker?: () => void };
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as PromoState | null) ?? {};
  const isEdit = state.mode === "edit";

  const data = loadOptionsServicesData();
  const existing =
    (state.itemId ? data.promoCodes.find((entry) => entry.id === state.itemId) : null) ??
    (state.item?.id ? data.promoCodes.find((entry) => entry.id === state.item?.id) : null) ??
    null;

  const [code, setCode] = useState(isEdit ? (existing?.code ?? state.item?.code ?? "") : "");
  const [dateDebutIso, setDateDebutIso] = useState(parseFrenchDateToIso(existing?.date || state.item?.date));
  const [dateExpirationIso, setDateExpirationIso] = useState(parseFrenchDateToIso(existing?.date || state.item?.date));
  const [montant, setMontant] = useState(isEdit ? (existing?.valeur ?? state.item?.valeur ?? "") : "");
  const [commandes, setCommandes] = useState(
    isEdit ? String(existing?.commandes ?? state.item?.commandes ?? "") : "",
  );
  const [utilisationMax, setUtilisationMax] = useState(
    isEdit ? String(existing?.utilisations ?? state.item?.utilisations ?? "") : "",
  );
  const dateDebutRef = useRef<HTMLInputElement>(null);
  const dateExpirationRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    if (!code.trim() || !montant.trim() || !dateDebutIso || !dateExpirationIso) {
      toast({ title: "Champs requis", description: "Code, montant et dates sont obligatoires." });
      return;
    }

    const start = new Date(`${dateDebutIso}T00:00:00`);
    const end = new Date(`${dateExpirationIso}T00:00:00`);
    if (end < start) {
      toast({ title: "Dates invalides", description: "La date d'expiration doit etre apres le debut." });
      return;
    }

    const dateLabel = `${formatIsoDateToFrench(dateDebutIso)} - ${formatIsoDateToFrench(dateExpirationIso)}`;

    const nextItem = {
      id: existing?.id || `promo-${Date.now()}`,
      code: code.trim().toUpperCase(),
      valeur: montant.trim(),
      commandes: Number(commandes) || 0,
      utilisations: Number(utilisationMax) || 0,
      date: dateLabel,
      actif: existing?.actif ?? true,
    };

    const nextPromoCodes = existing
      ? data.promoCodes.map((entry) => (entry.id === existing.id ? nextItem : entry))
      : [...data.promoCodes, nextItem];

    saveOptionsServicesData({
      ...data,
      promoCodes: nextPromoCodes,
    });

    toast({ title: isEdit ? "Code promo modifie" : "Code promo ajoute" });
    navigate("/options-services", { state: { tab: "promo" } });
  };

  return (
    <div className="page-shell flex min-h-screen bg-background">
      <SidebarNav />

      <main className="flex min-w-0 flex-1 flex-col gap-5 p-4 pb-8 pt-16 lg:gap-6 lg:p-6 lg:pt-6">
        <TopNav title="OPTIONS SERVICES" />

        <section className="mx-auto w-full max-w-[1120px]">
          <div className="rounded-[22px] border border-[#d3d3d9] bg-[#fff] p-6 shadow-[0_30px_70px_-24px_rgba(82,96,255,0.36)] lg:p-10">
            <h2 className="text-center text-2xl font-bold tracking-tight text-[#121217] lg:text-3xl">
              {isEdit ? "MODIFIER CODE PROMO" : "AJOUTER CODE PROMO"}
            </h2>

            <div className="mx-auto mt-10 max-w-[980px]">
              <p className="text-xl font-semibold text-[#17171c]">Code promo</p>
              <p className="mt-1 text-sm italic text-[#25252b] lg:text-[15px]">Configurez les remises et la validite du code.</p>

              <div className="mt-4 h-px bg-[#d0d0d6]" />

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                <label className="space-y-2">
                  <span className="block text-[15px] font-semibold text-[#212127]">Code</span>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Ex : PROMO123"
                    className="h-14 w-full rounded-xl border border-[#ceced5] bg-[#ececf0] px-4 text-[15px] text-[#2b2b31]"
                  />
                </label>

                <label className="space-y-2">
                  <span className="block text-[15px] font-semibold text-[#212127]">Date du debut</span>
                  <div className="relative">
                    <input
                      value={formatIsoDateToFrench(dateDebutIso)}
                      placeholder="12 septembre 2025"
                      readOnly
                      className="h-14 w-full rounded-xl border border-[#ceced5] bg-[#ececf0] px-12 text-[15px] text-[#2b2b31]"
                    />
                    <input
                      ref={dateDebutRef}
                      type="date"
                      value={dateDebutIso}
                      onChange={(e) => setDateDebutIso(e.target.value)}
                      className="sr-only"
                    />
                    <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#111116]" />
                    <button
                      type="button"
                      onClick={() => {
                        const picker = dateDebutRef.current as DatePickerInput | null;
                        if (!picker) return;
                        if (typeof picker.showPicker === "function") {
                          picker.showPicker();
                          return;
                        }
                        picker.click();
                      }}
                      className="absolute inset-0 rounded-xl"
                      aria-label="Choisir la date de debut"
                    />
                  </div>
                </label>

                <label className="space-y-2">
                  <span className="block text-[15px] font-semibold text-[#212127]">Date d'expiration</span>
                  <div className="relative">
                    <input
                      value={formatIsoDateToFrench(dateExpirationIso)}
                      placeholder="12 septembre 2025"
                      readOnly
                      className="h-14 w-full rounded-xl border border-[#ceced5] bg-[#ececf0] px-12 text-[15px] text-[#2b2b31]"
                    />
                    <input
                      ref={dateExpirationRef}
                      type="date"
                      value={dateExpirationIso}
                      onChange={(e) => setDateExpirationIso(e.target.value)}
                      className="sr-only"
                    />
                    <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#111116]" />
                    <button
                      type="button"
                      onClick={() => {
                        const picker = dateExpirationRef.current as DatePickerInput | null;
                        if (!picker) return;
                        if (typeof picker.showPicker === "function") {
                          picker.showPicker();
                          return;
                        }
                        picker.click();
                      }}
                      className="absolute inset-0 rounded-xl"
                      aria-label="Choisir la date d'expiration"
                    />
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <label className="space-y-2">
                  <span className="block text-[15px] font-semibold text-[#212127]">Montant</span>
                  <input
                    value={montant}
                    onChange={(e) => setMontant(e.target.value)}
                    placeholder="Ajouter un montant"
                    className="h-14 w-full rounded-xl border border-[#ceced5] bg-[#ececf0] px-4 text-[15px] text-[#2b2b31]"
                  />
                </label>
                <label className="space-y-2">
                  <span className="block text-[15px] font-semibold text-[#212127]">Nombre de commande</span>
                  <input
                    value={commandes}
                    onChange={(e) => setCommandes(e.target.value)}
                    placeholder="0"
                    className="h-14 w-full rounded-xl border border-[#ceced5] bg-[#ececf0] px-4 text-[15px] text-[#2b2b31]"
                  />
                </label>

                <label className="space-y-2">
                  <span className="block text-[15px] font-semibold text-[#212127]">Utilisation Max</span>
                  <div className="relative">
                    <input
                      value={utilisationMax}
                      onChange={(e) => setUtilisationMax(e.target.value)}
                      placeholder="Utilisation max"
                      className="h-14 w-full rounded-xl border border-[#ceced5] bg-[#ececf0] px-4 pr-12 text-[15px] text-[#2b2b31]"
                    />
                    <ChevronsUpDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black" />
                  </div>
                </label>
              </div>

              <div className="pt-12 text-center">
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex h-12 min-w-[250px] items-center justify-center gap-2 rounded-xl bg-[#0f7bf1] px-7 text-base font-semibold text-white transition-colors hover:bg-[#0c69cf]"
                >
                  {isEdit ? "Mettre a jour le code" : "Ajouter le code promo"}
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default OptionsServicesCodePromo;
