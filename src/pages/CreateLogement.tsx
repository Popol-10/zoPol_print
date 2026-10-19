import { ChevronDown } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SidebarNav from "@/components/SidebarNav";
import TopNav from "@/components/TopNav";
import { createDefaultLogementDraft, saveLogementDraft, loadLogementDraft } from "@/lib/logementDraft";
import { toast } from "@/components/ui/use-toast";
import { getAllCountries } from "@/lib/countries";
import { buildDraftFromLogement, getLogementById } from "@/lib/logementsStore";
const countries = getAllCountries("fr");
const currentStep = 1;

interface CreateLogementLocationState {
  mode?: "create" | "edit";
  fromStep?: boolean;
  logementId?: number;
}

const CreateLogement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = (location.state as CreateLogementLocationState | null) ?? {};
  const draft = loadLogementDraft();
  const [type, setType] = useState(draft.type);
  const [name, setName] = useState(draft.name);
  const [capacity, setCapacity] = useState(draft.capacity);
  const [address, setAddress] = useState(draft.address);
  const [city, setCity] = useState(draft.city);
  const [country, setCountry] = useState(draft.country);
  const [description, setDescription] = useState(draft.description);

  const applyDraftToForm = (nextDraft: ReturnType<typeof loadLogementDraft>) => {
    setType(nextDraft.type);
    setName(nextDraft.name);
    setCapacity(nextDraft.capacity);
    setAddress(nextDraft.address);
    setCity(nextDraft.city);
    setCountry(nextDraft.country);
    setDescription(nextDraft.description);
  };

  useEffect(() => {
    if (routeState.fromStep) return;

    if (routeState.mode === "edit" && typeof routeState.logementId === "number") {
      const existing = getLogementById(routeState.logementId);
      if (existing) {
        const nextDraft = { ...createDefaultLogementDraft(), ...buildDraftFromLogement(existing) };
        saveLogementDraft(nextDraft);
        applyDraftToForm(nextDraft);
        return;
      }
    }

    const freshDraft = createDefaultLogementDraft();
    saveLogementDraft(freshDraft);
    applyDraftToForm(freshDraft);
  }, [routeState.fromStep, routeState.mode, routeState.logementId]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !capacity.trim()) {
      toast({
        title: "Champs requis",
        description: "Renseignez au minimum le nom du logement et la capacité.",
      });
      return;
    }

    saveLogementDraft({
      editingLogementId: draft.editingLogementId,
      type,
      name: name.trim(),
      capacity: capacity.trim(),
      address: address.trim(),
      city: city.trim(),
      country: country.trim(),
      description: description.trim(),
    });

    navigate("/logements/create/step-2");
  };

  return (
    <div className="page-shell flex min-h-screen bg-[#eeeff7]">
      <SidebarNav />

      <main className="flex-1 min-w-0 p-4 pt-16 lg:p-6 lg:pl-6 lg:pt-6">
        <div className="mx-auto w-full max-w-[1400px]">
          <TopNav title="CREER UN LOGEMENT" />

          <section className="anim-item mt-7 rounded-2xl border border-[#d0d1dc] bg-[#fff] px-4 py-8 sm:px-8 lg:px-14 lg:py-10">
            <header className="text-center">
              <h1 className="text-[24px] font-bold text-[#101010] sm:text-[28px]">ETAPE 1</h1>
              <p className="mt-2 text-[16px] font-semibold text-[#111111] sm:text-[20px]">
                Informations generales
              </p>
            </header>

            <div className="relative mx-auto mt-8 flex w-full max-w-[420px] items-center md:max-w-[500px]">
              <div className="h-[7px] w-full rounded-full bg-[#d4d4d7]" />
              <div
                className="absolute left-0 top-1/2 h-[7px] -translate-y-1/2 rounded-full bg-[#1d7df2]"
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              />
              <div className="pointer-events-none absolute left-0 top-1/2 flex w-full -translate-y-1/2 items-center justify-between">
                {[1, 2, 3, 4].map((step) => {
                  const active = step <= currentStep;
                  return (
                    <div
                      key={step}
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold leading-none ${
                        active ? "bg-[#1d7df2] text-white" : "bg-[#bdd6f8] text-[#4b96ec]"
                      }`}
                    >
                      {step}
                    </div>
                  );
                })}
              </div>
            </div>

            <form className="anim-stagger mt-14" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
                <label className="block">
                  <span className="mb-2 block text-[16px] font-semibold text-[#1f1f1f]">Type de logement</span>
                  <div className="relative anim-item">
                    <select
                      value={type}
                      onChange={(event) => setType(event.target.value)}
                      className="h-[64px] w-full appearance-none rounded-xl border border-[#c5c6cb] bg-[#ececf0] px-5 pr-14 text-[15px] text-[#404040] outline-none"
                    >
                      <option>Appartement</option>
                      <option>Villa</option>
                      <option>Studio</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#202020]" />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-[16px] font-semibold text-[#1f1f1f]">Nom du Logement</span>
                  <input
                    type="text"
                    placeholder="Adresse de l’appartement"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="anim-item h-[64px] w-full rounded-xl border border-[#c5c6cb] bg-[#ececf0] px-5 text-[15px] text-[#404040] placeholder:text-[#4d4d4d] outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[16px] font-semibold text-[#1f1f1f]">Capacite</span>
                  <input
                    type="text"
                    placeholder="Capacite du logement"
                    value={capacity}
                    onChange={(event) => setCapacity(event.target.value)}
                    className="anim-item h-[64px] w-full rounded-xl border border-[#c5c6cb] bg-[#ececf0] px-5 text-[15px] text-[#404040] placeholder:text-[#4d4d4d] outline-none"
                  />
                </label>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
                <label className="block">
                  <span className="mb-2 block text-[16px] font-semibold text-[#1f1f1f]">Adresse</span>
                  <input
                    type="text"
                    placeholder="Adresse de l’appartement"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    className="anim-item h-[64px] w-full rounded-xl border border-[#c5c6cb] bg-[#ececf0] px-5 text-[15px] text-[#404040] placeholder:text-[#4d4d4d] outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[16px] font-semibold text-[#1f1f1f]">Ville</span>
                  <input
                    type="text"
                    placeholder="Ville de Lorem"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    className="anim-item h-[64px] w-full rounded-xl border border-[#c5c6cb] bg-[#ececf0] px-5 text-[15px] text-[#404040] placeholder:text-[#4d4d4d] outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[16px] font-semibold text-[#1f1f1f]">Pays</span>
                  <div className="relative anim-item">
                    <select
                      value={country}
                      onChange={(event) => setCountry(event.target.value)}
                      className="h-[64px] w-full appearance-none rounded-xl border border-[#c5c6cb] bg-[#ececf0] px-5 pr-14 text-[15px] text-[#404040] outline-none"
                    >
                      <option value="" disabled>
                        Choisir un pays
                      </option>
                      {countries.map((countryItem) => {
                        const value = `${countryItem.flag} ${countryItem.name}`;
                        return (
                          <option key={countryItem.code} value={value}>
                            {value}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#202020]" />
                  </div>
                </label>
              </div>

              <label className="mt-5 block anim-item">
                <span className="mb-2 block text-[16px] font-semibold text-[#1f1f1f]">Description</span>
                <textarea
                  rows={4}
                  placeholder="Ajouter une description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="min-h-[160px] w-full resize-none rounded-xl border border-[#c5c6cb] bg-[#ececf0] px-5 py-4 text-[15px] text-[#404040] placeholder:text-[#4d4d4d] outline-none lg:min-h-[180px]"
                />
              </label>

              <div className="mt-10 flex justify-end">
                <button
                  type="submit"
                  className="anim-item inline-flex h-[56px] w-full items-center justify-center rounded-xl bg-[#0f7cff] px-8 text-[16px] font-semibold text-white hover:opacity-95 sm:w-auto sm:min-w-[230px]"
                >
                  Etape suivante
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
};

export default CreateLogement;
