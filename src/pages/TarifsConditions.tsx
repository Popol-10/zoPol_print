import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, CreditCard, Info, Lock, Tag, Trash2 } from "lucide-react";
import SidebarNav from "@/components/SidebarNav";
import TopNav from "@/components/TopNav";
import { toast } from "@/components/ui/use-toast";

const TARIFS_CONDITIONS_STORAGE_KEY = "tarifs-conditions-v1";

type PromoItem = {
  id: string;
  nights: string;
  discount: string;
};

type PromoCodeItem = {
  id: string;
  code: string;
  reduction: string;
  logements: string;
  statut: "Actif" | "Inactif";
};

type TarifsConditionsState = {
  nightPrice: string;
  weekendPrice: string;
  seasonalPrice: string;
  smartPricing: boolean;
  extraFee: string;
  platformServiceFee: string;
  additionalTravelerFee: string;
  cautionEnabled: boolean;
  cautionAmount: string;
  cautionType: string;
  selectedRules: string[];
  globalBasePrice: string;
  globalWeekendPrice: string;
  highSeasonPeriods: string[];
  minBookingBeforeArrival: string;
  maxNights: string;
  checkIn: string;
  checkOut: string;
  minNights: string;
  cleaningFee: string;
  linenFee: string;
  serviceFee: string;
  promotions: PromoItem[];
  promoCodes: PromoCodeItem[];
};

const defaultState: TarifsConditionsState = {
  nightPrice: "350€",
  weekendPrice: "150€",
  seasonalPrice: "Aucune",
  smartPricing: true,
  extraFee: "50€",
  platformServiceFee: "10%",
  additionalTravelerFee: "10€/personne",
  cautionEnabled: true,
  cautionAmount: "500€",
  cautionType: "Pré-autorisation",
  selectedRules: ["Tous les logements", "Lorem Appart", "Studio Nunc"],
  globalBasePrice: "120€",
  globalWeekendPrice: "120€",
  highSeasonPeriods: [],
  minBookingBeforeArrival: "1 jour",
  maxNights: "30",
  checkIn: "16:00",
  checkOut: "11:00",
  minNights: "2",
  cleaningFee: "10€",
  linenFee: "20€",
  serviceFee: "30€",
  promotions: [
    { id: "promo-1", nights: "7 nuits", discount: "-10%" },
    { id: "promo-2", nights: "30 nuits", discount: "-10%" },
  ],
  promoCodes: [
    {
      id: "code-1",
      code: "LOREM123",
      reduction: "-10%",
      logements: "Tous",
      statut: "Actif",
    },
  ],
};

const loadState = (): TarifsConditionsState => {
  if (typeof window === "undefined") return defaultState;

  try {
    const raw = window.localStorage.getItem(TARIFS_CONDITIONS_STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<TarifsConditionsState>;
    return { ...defaultState, ...parsed };
  } catch {
    return defaultState;
  }
};

const SelectBox = ({
  value,
  onChange,
  options,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  className?: string;
}) => (
  <div className={`relative ${className}`}>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="inline-flex h-11 w-full appearance-none items-center justify-between gap-3 rounded-xl border border-[#cfcfd6] bg-[#efeff3] px-4 pr-10 text-sm font-medium text-[#17171b]"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
  </div>
);

const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
  <button
    type="button"
    onClick={onToggle}
    className="relative h-8 w-[58px] rounded-full bg-[#d4d4d8] p-1 transition-colors"
    aria-label="Basculer"
    aria-pressed={enabled}
  >
    <span
      className={`block h-6 w-6 rounded-full bg-[#0b7ff2] transition-transform ${enabled ? "translate-x-6" : "translate-x-0"}`}
    />
  </button>
);

const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <section className={`rounded-2xl border border-[#d9d9df] bg-[#f4f4f6] p-6 ${className}`}>{children}</section>
);

const TarifsConditions = () => {
  const [form, setForm] = useState<TarifsConditionsState>(() => loadState());
  const [newSeasonPeriod, setNewSeasonPeriod] = useState("");
  const [showPreAuthDetails, setShowPreAuthDetails] = useState(false);

  const logements = [
    "Tous les logements",
    "Appartements Lorem",
    "Studio Ipsum",
    "Lorem Appart",
    "Villa Elit",
    "Studio Nunc",
  ];

  useEffect(() => {
    window.localStorage.setItem(TARIFS_CONDITIONS_STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  const updateField = <K extends keyof TarifsConditionsState>(key: K, value: TarifsConditionsState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleRule = (item: string) => {
    setForm((prev) => ({
      ...prev,
      selectedRules: prev.selectedRules.includes(item)
        ? prev.selectedRules.filter((entry) => entry !== item)
        : [...prev.selectedRules, item],
    }));
  };

  const addHighSeasonPeriod = () => {
    const value = newSeasonPeriod.trim();
    if (!value) return;

    setForm((prev) => ({ ...prev, highSeasonPeriods: [...prev.highSeasonPeriods, value] }));
    setNewSeasonPeriod("");
  };

  const removeHighSeasonPeriod = (index: number) => {
    setForm((prev) => ({
      ...prev,
      highSeasonPeriods: prev.highSeasonPeriods.filter((_, idx) => idx !== index),
    }));
  };

  const addPromotion = () => {
    const next: PromoItem = {
      id: `promo-${Date.now()}`,
      nights: "14 nuits",
      discount: "-5%",
    };
    setForm((prev) => ({ ...prev, promotions: [...prev.promotions, next] }));
  };

  const removePromotion = (id: string) => {
    setForm((prev) => ({ ...prev, promotions: prev.promotions.filter((item) => item.id !== id) }));
  };

  const createPromoCode = () => {
    const code = `CODE${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const next: PromoCodeItem = {
      id: `code-${Date.now()}`,
      code,
      reduction: "-5%",
      logements: form.selectedRules.length === logements.length ? "Tous" : `${form.selectedRules.length} ciblés`,
      statut: "Actif",
    };

    setForm((prev) => ({ ...prev, promoCodes: [...prev.promoCodes, next] }));
  };

  const togglePromoCodeStatus = (id: string) => {
    setForm((prev) => ({
      ...prev,
      promoCodes: prev.promoCodes.map((item) =>
        item.id === id ? { ...item, statut: item.statut === "Actif" ? "Inactif" : "Actif" } : item
      ),
    }));
  };

  const summary = useMemo(() => {
    const night = Number(form.nightPrice.replace(/[^0-9]/g, "")) || 0;
    const weekend = Number(form.weekendPrice.replace(/[^0-9]/g, "")) || 0;
    const avg = Math.round((night * 5 + weekend * 2) / 7);
    const occupancy = form.smartPricing ? "72%" : "65%";
    const monthly = Math.round(avg * 30 * (form.smartPricing ? 0.72 : 0.65));

    return {
      avg: `${avg}€`,
      monthly: `${monthly}€`,
      occupancy,
    };
  }, [form.nightPrice, form.weekendPrice, form.smartPricing]);

  const handleSave = () => {
    window.localStorage.setItem(TARIFS_CONDITIONS_STORAGE_KEY, JSON.stringify(form));
    toast({
      title: "Tarifs enregistrés",
      description: "Les tarifs et conditions ont bien été sauvegardés.",
    });
  };

  return (
    <div className="page-shell flex min-h-screen bg-background">
      <SidebarNav />

      <main className="flex min-w-0 flex-1 flex-col gap-5 p-4 pb-8 pt-16 lg:gap-6 lg:p-6 lg:pt-6">
        <TopNav title="TARIFS ET CONDITIONS" />

        <section className="mx-auto w-full max-w-[1120px] space-y-6">
          <h2 className="text-2xl font-bold tracking-tight text-[#16161b] lg:text-3xl">Tarifs et conditions</h2>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-[#16161b] lg:text-2xl">Prix par nuit</h3>
            <Card className="bg-white shadow-[0_28px_65px_-22px_rgba(82,96,255,0.36)]">
              <div className="flex flex-wrap items-center gap-6 xl:gap-10">
                <div className="flex items-center gap-5">
                  <p className="text-[15px] font-semibold text-[#15151a] lg:text-base">Prix par nuit</p>
                  <SelectBox
                    value={form.nightPrice}
                    onChange={(value) => updateField("nightPrice", value)}
                    options={["100€", "150€", "200€", "250€", "300€", "350€", "400€"]}
                    className="w-[140px]"
                  />
                </div>

                <div className="flex items-center gap-5">
                  <p className="text-[15px] font-semibold text-[#15151a] lg:text-base">Prix weekend</p>
                  <SelectBox
                    value={form.weekendPrice}
                    onChange={(value) => updateField("weekendPrice", value)}
                    options={["100€", "120€", "150€", "180€", "200€", "250€"]}
                    className="w-[140px]"
                  />
                </div>

                <div className="flex items-center gap-5">
                  <p className="text-[15px] font-semibold text-[#15151a] lg:text-base">Prix saisonnier</p>
                  <SelectBox
                    value={form.seasonalPrice}
                    onChange={(value) => updateField("seasonalPrice", value)}
                    options={["Aucune", "Haute saison +10%", "Haute saison +20%", "Basse saison -10%"]}
                    className="w-[235px]"
                  />
                </div>
              </div>

              <div className="mt-10 flex items-center justify-between gap-4">
                <label className="flex items-center gap-3 text-[15px] text-[#202026] lg:text-base">
                  <input
                    type="checkbox"
                    checked={form.smartPricing}
                    onChange={(event) => updateField("smartPricing", event.target.checked)}
                    className="h-6 w-6 rounded border-[#bcbcc4]"
                  />
                  <span>Tarification intelligente</span>
                </label>
                <Toggle enabled={form.smartPricing} onToggle={() => updateField("smartPricing", !form.smartPricing)} />
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-[#16161b] lg:text-2xl">Frais supplémentaire</h3>
            <Card className="bg-white shadow-[0_28px_65px_-22px_rgba(82,96,255,0.36)]">
              <div className="flex flex-wrap items-center gap-6 xl:gap-14">
                <SelectBox
                  value={form.extraFee}
                  onChange={(value) => updateField("extraFee", value)}
                  options={["0€", "10€", "20€", "30€", "50€"]}
                  className="w-[140px]"
                />

                <p className="text-[15px] font-semibold leading-tight text-[#15151a] lg:text-base">Frais de service de plateforme</p>
                <SelectBox
                  value={form.platformServiceFee}
                  onChange={(value) => updateField("platformServiceFee", value)}
                  options={["0%", "5%", "10%", "12%", "15%"]}
                  className="w-[140px]"
                />

                <p className="text-[15px] font-semibold leading-tight text-[#15151a] lg:text-base">Frais voyageur additionnel</p>
                <SelectBox
                  value={form.additionalTravelerFee}
                  onChange={(value) => updateField("additionalTravelerFee", value)}
                  options={["0€/personne", "5€/personne", "10€/personne", "15€/personne"]}
                  className="w-[200px]"
                />
              </div>

              <div className="my-8 h-px bg-[#cfcfd6]" />

              <button
                type="button"
                onClick={() => setShowPreAuthDetails((prev) => !prev)}
                className="flex w-full items-center justify-between text-left"
              >
                <span className="flex items-center gap-4 text-[15px] font-semibold text-[#17171c] lg:text-base">
                  <CreditCard className="h-6 w-6 lg:h-7 lg:w-7" />
                  Pré autorisation carte
                </span>
                <span className="flex items-center gap-6 text-[#111116]">
                  <Info className="h-6 w-6" />
                  <ChevronRight className={`h-6 w-6 transition-transform ${showPreAuthDetails ? "rotate-90" : ""}`} />
                </span>
              </button>

              {showPreAuthDetails ? (
                <p className="mt-4 rounded-xl bg-[#f4f6fb] px-4 py-3 text-[14px] text-[#3a3a42]">
                  Montant bloqué temporairement sur la carte du voyageur, puis libéré automatiquement.
                </p>
              ) : null}
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-[#16161b] lg:text-2xl">Dépot de garanties</h3>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card className="bg-white shadow-[0_28px_65px_-22px_rgba(82,96,255,0.36)]">
                <div className="flex items-center gap-4">
                  <Toggle enabled={form.cautionEnabled} onToggle={() => updateField("cautionEnabled", !form.cautionEnabled)} />
                  <p className="text-[15px] font-semibold text-[#17171c] lg:text-base">Activer caution</p>
                </div>

                <div className="mt-8 flex items-center justify-between gap-4">
                  <span className="text-[15px] font-semibold text-[#17171c] lg:text-base">Montant</span>
                  <SelectBox
                    value={form.cautionAmount}
                    onChange={(value) => updateField("cautionAmount", value)}
                    options={["100€", "250€", "500€", "700€", "1000€"]}
                    className="w-[120px]"
                  />
                </div>

                <p className="mt-6 text-[15px] font-semibold text-[#17171c] lg:text-base">Type : {form.cautionType}</p>
              </Card>

              <Card className="bg-white shadow-[0_28px_65px_-22px_rgba(82,96,255,0.36)]">
                <h4 className="text-lg font-semibold text-[#16161b] lg:text-xl">Résumé</h4>
                <div className="mt-5 space-y-2 text-[15px] font-semibold text-[#1f1f24] lg:text-base">
                  <p>Prix moyen : {summary.avg}</p>
                  <p>Revend estimé/mois : {summary.monthly}</p>
                  <p>Taux d’occupation estimé : {summary.occupancy}</p>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
              <Card className="bg-white shadow-[0_28px_65px_-22px_rgba(82,96,255,0.36)]">
                <h4 className="text-lg font-semibold text-[#16161b] lg:text-xl">Appliquer les règles à :</h4>
                <div className="mt-5 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                  {logements.map((item) => (
                    <label key={item} className="flex items-center gap-3 text-sm text-[#2a2a30] lg:text-[15px]">
                      <input
                        type="checkbox"
                        checked={form.selectedRules.includes(item)}
                        onChange={() => toggleRule(item)}
                        className="h-5 w-5 rounded border-[#c1c1c9]"
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </Card>

              <Card className="bg-white shadow-[0_28px_65px_-22px_rgba(82,96,255,0.36)]">
                <h4 className="text-lg font-semibold text-[#16161b] lg:text-xl">Tarifs globaux</h4>
                <div className="my-3 h-px bg-[#cfcfd6]" />

                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between ">
                    <span className="text-sm font-semibold text-[#17171c]">Prix de base par nuit</span>
                    <SelectBox
                      value={form.globalBasePrice}
                      onChange={(value) => updateField("globalBasePrice", value)}
                      options={["90€", "100€", "110€", "120€", "140€"]}
                      className="h-8 w-[90px]  text-[10px]"
                    />
                    <span className="text-sm font-semibold text-[#17171c]">Prix Weekend</span>
                    <SelectBox
                      value={form.globalWeekendPrice}
                      onChange={(value) => updateField("globalWeekendPrice", value)}
                      options={["100€", "120€", "140€", "160€"]}
                      className="h-8 w-[95px]  text-[10px]"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-[#17171c]">Tarif haute saison</span>
                    <input
                      value={newSeasonPeriod}
                      onChange={(event) => setNewSeasonPeriod(event.target.value)}
                      placeholder="Ex: 15/07 - 31/08 +20%"
                      className="h-10 min-w-[220px] flex-1 rounded-lg border border-[#cfcfd6] bg-[#efeff3] px-3 text-[14px] text-[#17171b]"
                    />
                    <button
                      type="button"
                      onClick={addHighSeasonPeriod}
                      className="h-10 rounded-lg bg-black px-6 text-[15px] font-semibold text-white"
                    >
                      Ajouter période
                    </button>
                  </div>

                  {form.highSeasonPeriods.length > 0 ? (
                    <div className="space-y-2">
                      {form.highSeasonPeriods.map((period, index) => (
                        <div key={`${period}-${index}`} className="flex items-center justify-between rounded-lg bg-[#f3f4f7] px-3 py-2 text-[14px] text-[#1f1f24]">
                          <span>{period}</span>
                          <button type="button" onClick={() => removeHighSeasonPeriod(index)} className="text-[#ff226d]">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
              <Card className="bg-white shadow-[0_28px_65px_-22px_rgba(82,96,255,0.36)]">
                <h4 className="text-center text-lg font-semibold text-[#16161b] lg:text-xl">CONDITIONS DE SÉJOUR</h4>

                <div className="mt-8 space-y-6">
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-[#18181d]">Réservation minimum avant arrivée</p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <SelectBox
                        value={form.minBookingBeforeArrival}
                        onChange={(value) => updateField("minBookingBeforeArrival", value)}
                        options={["1 jour", "2 jours", "3 jours", "7 jours"]}
                      />
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-[#18181d]">Maximum nuit</span>
                        <SelectBox
                          value={form.maxNights}
                          onChange={(value) => updateField("maxNights", value)}
                          options={["7", "14", "21", "30", "60"]}
                          className="h-10 w-[100px] px-3 text-[13px]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-2 text-sm font-semibold text-[#18181d]">Check-in</p>
                      <SelectBox
                        value={form.checkIn}
                        onChange={(value) => updateField("checkIn", value)}
                        options={["14:00", "15:00", "16:00", "17:00", "18:00"]}
                      />
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-semibold text-[#18181d]">Check-out</p>
                      <SelectBox
                        value={form.checkOut}
                        onChange={(value) => updateField("checkOut", value)}
                        options={["10:00", "11:00", "12:00"]}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <span className="text-sm font-semibold text-[#18181d]">Minimum nuit</span>
                    <SelectBox
                      value={form.minNights}
                      onChange={(value) => updateField("minNights", value)}
                      options={["1", "2", "3", "5", "7"]}
                      className="h-10 w-[95px] px-3 text-[14px]"
                    />
                  </div>
                </div>
              </Card>

              <div className="space-y-4">
                <Card className="bg-white shadow-[0_28px_65px_-22px_rgba(82,96,255,0.36)]">
                  <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#16161b] lg:text-xl">
                    <Lock className="h-7 w-7 rounded-md bg-[#d8ecff] p-1 text-[#0b7ff2]" /> Frais
                  </h4>

                  <div className="space-y-3">
                    {[
                      ["Frais ménage", "cleaningFee"] as const,
                      ["Frais linge", "linenFee"] as const,
                      ["Frais service", "serviceFee"] as const,
                    ].map(([label, key]) => (
                      <div key={label} className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-[#19191f]">{label}</span>
                        <SelectBox
                          value={form[key]}
                          onChange={(value) => updateField(key, value)}
                          options={["0€", "5€", "10€", "20€", "30€"]}
                          className="h-9 w-[100px]  text-[13px]"
                        />
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="bg-white shadow-[0_28px_65px_-22px_rgba(82,96,255,0.36)]">
                  <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#16161b] lg:text-xl">
                    <Tag className="h-7 w-7 rounded-md bg-[#ffd9e6] p-1 text-[#ff2c72]" /> Promotions globales
                  </h4>
                  <div className="space-y-2 text-sm font-semibold text-[#1d1d23]">
                    {form.promotions.map((promo) => (
                      <div key={promo.id} className="flex items-center justify-between gap-3">
                        <p className="flex items-center gap-3">
                          {promo.nights} <span className="text-[#ff2c72]">-&gt; {promo.discount}</span>
                        </p>
                        <button type="button" onClick={() => removePromotion(promo.id)} className="text-[#ff2c72]" aria-label="Supprimer promotion">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addPromotion}
                    className="mt-5 h-10 w-full rounded-lg bg-[#ff226d] text-[15px] font-semibold text-white"
                  >
                    Ajouter une promotion
                  </button>
                </Card>

                <Card className="bg-white shadow-[0_28px_65px_-22px_rgba(82,96,255,0.36)]">
                  <h4 className="text-lg font-semibold text-[#16161b] lg:text-xl">Codes promo (global)</h4>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[16px] font-semibold text-[#1f1f25]">
                          <th className="pb-2">Code</th>
                          <th className="pb-2">Réduction</th>
                          <th className="pb-2">Logements</th>
                          <th className="pb-2">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.promoCodes.map((item) => (
                          <tr key={item.id} className="text-[14px] text-[#3b3b42]">
                            <td className="py-2">{item.code}</td>
                            <td className="py-2">{item.reduction}</td>
                            <td className="py-2">{item.logements}</td>
                            <td className="py-2">
                              <button
                                type="button"
                                onClick={() => togglePromoCodeStatus(item.id)}
                                className={`rounded px-2 py-1 text-[12px] font-semibold ${
                                  item.statut === "Actif" ? "bg-[#ddf7e5] text-[#1c8a44]" : "bg-[#f1f1f4] text-[#666]"
                                }`}
                              >
                                {item.statut}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    type="button"
                    onClick={createPromoCode}
                    className="mt-4 h-10 w-full rounded-lg bg-black text-[15px] font-semibold text-white"
                  >
                    Créer un code promo
                  </button>
                </Card>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                className="h-11 rounded-xl bg-[#0f7cff] px-6 text-[15px] font-semibold text-white"
              >
                Enregistrer les modifications
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default TarifsConditions;
