import SidebarNav from "@/components/SidebarNav";
import TopNav from "@/components/TopNav";
import { CalendarDays, Minus, Plus, X } from "lucide-react";
import { Dispatch, FormEvent, SetStateAction, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadLogementDraft, saveLogementDraft } from "@/lib/logementDraft";
import { toast } from "@/components/ui/use-toast";

const formulas = ["2 Heures", "3 Heures", "4 Heures", "5 Heures", "6 Heures", "Formule nuité", "Midi et Spa"];
const currentStep = 2;

const CreateLogementStep2 = () => {
  const navigate = useNavigate();
  const draft = loadLogementDraft();
  const [chambre, setChambre] = useState(draft.bedrooms);
  const [salleDeBain, setSalleDeBain] = useState(draft.bathrooms);
  const [nombreDeLit, setNombreDeLit] = useState(draft.beds);
  const [equipement, setEquipement] = useState("");
  const [equipements, setEquipements] = useState(draft.equipements);
  const [selectedFormula, setSelectedFormula] = useState<string | null>(draft.formulas[0] ?? null);
  const [dateValue, setDateValue] = useState(draft.availableFrom);

  const increment = (setter: Dispatch<SetStateAction<number>>) => {
    setter((value) => value + 1);
  };

  const decrement = (setter: Dispatch<SetStateAction<number>>) => {
    setter((value) => Math.max(0, value - 1));
  };

  const addEquipement = () => {
    const normalized = equipement.trim();
    if (!normalized) {
      return;
    }
    setEquipements((current) => [...current, normalized]);
    setEquipement("");
  };

  const removeEquipement = (indexToRemove: number) => {
    setEquipements((current) => current.filter((_, index) => index !== indexToRemove));
  };

  const toggleFormula = (formula: string) => {
    setSelectedFormula((current) => (current === formula ? null : formula));
  };

  const persistStep2 = () => {
    saveLogementDraft({
      bedrooms: chambre,
      bathrooms: salleDeBain,
      beds: nombreDeLit,
      equipements,
      formulas: selectedFormula ? [selectedFormula] : [],
      availableFrom: dateValue,
    });
  };

  const goPrevious = () => {
    persistStep2();
    navigate("/logements/create", { state: { fromStep: true } });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedFormula) {
      toast({
        title: "Formule requise",
        description: "Sélectionnez au moins une formule disponible.",
      });
      return;
    }

    persistStep2();
    navigate("/logements/create/step-3");
  };

  return (
    <div className="page-shell flex min-h-screen bg-[#eeeff7]">
      <SidebarNav />

      <main className="flex-1 min-w-0 p-4 pt-16 lg:p-6 lg:pl-6 lg:pt-6">
        <div className="mx-auto w-full max-w-[1400px]">
          <TopNav title="CREER UN LOGEMENT" />

          <section className="anim-item mt-7 rounded-2xl border border-[#d0d1dc] bg-[#fff] px-4 py-8 sm:px-8 md:px-10 lg:px-20 lg:py-12">
            <header className="text-center">
              <h1 className="text-[25px] font-bold text-[#101010] sm:text-[33px]">ETAPE 2</h1>
              <p className="mt-2 text-[18px] font-semibold text-[#111111] sm:text-[25px]">Détails du logement</p>
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
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                <label className="block">
                  <span className="mb-2 block text-[18px] font-semibold text-[#1f1f1f]">Chambre</span>
                  <div className="anim-item flex h-[50px] items-center justify-between rounded-xl border border-[#c4c5cb] bg-[#ececf0] px-5">
                    <button
                      type="button"
                      onClick={() => decrement(setChambre)}
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black text-white transition-transform duration-150 hover:scale-105"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-[15px] text-[#242424]">{chambre}</span>
                    <button
                      type="button"
                      onClick={() => increment(setChambre)}
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black text-white transition-transform duration-150 hover:scale-105"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-[18px] font-semibold text-[#1f1f1f]">Salle de bain</span>
                  <div className="anim-item flex h-[50px] items-center justify-between rounded-xl border border-[#c4c5cb] bg-[#ececf0] px-2">
                    <button
                      type="button"
                      onClick={() => decrement(setSalleDeBain)}
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black text-white transition-transform duration-150 hover:scale-105"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-[15px] text-[#242424]">{salleDeBain}</span>
                    <button
                      type="button"
                      onClick={() => increment(setSalleDeBain)}
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black text-white transition-transform duration-150 hover:scale-105"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-[18px] font-semibold text-[#1f1f1f]">Nombre de lit</span>
                  <div className="anim-item flex h-[50px] items-center justify-between rounded-xl border border-[#c4c5cb] bg-[#ececf0] px-5">
                    <button
                      type="button"
                      onClick={() => decrement(setNombreDeLit)}
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black text-white transition-transform duration-150 hover:scale-105"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-[15px] text-[#242424]">{nombreDeLit}</span>
                    <button
                      type="button"
                      onClick={() => increment(setNombreDeLit)}
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black text-white transition-transform duration-150 hover:scale-105"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </label>
              </div>

              <div className="mt-8">
                <label className="block anim-item">
                  <span className="mb-2 block text-[18px] font-semibold text-[#1f1f1f]">Equipement</span>
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <input
                      type="text"
                      placeholder="Ex : Jacuzzi"
                      value={equipement}
                      onChange={(event) => setEquipement(event.target.value)}
                      className="h-[50px] w-full rounded-xl border border-[#c5c6cb] bg-[#ececf0] px-5 text-[15px] text-[#404040] placeholder:text-[#4d4d4d] outline-none transition-shadow duration-200 hover:shadow-sm focus:shadow-sm sm:text-[15px]"
                    />
                    <button
                      type="button"
                      onClick={addEquipement}
                      className="anim-item inline-flex h-[50px] min-w-[180px] items-center justify-center gap-3 rounded-xl bg-black px-6 text-[13px] font-semibold text-white transition-opacity duration-200 hover:opacity-90 md:min-w-[220px] sm:text-[15px]"
                    >
                      <Plus className="h-4 w-4" />
                      Ajouter
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {equipements.map((item, index) => (
                      <button
                        key={`${item}-${index}`}
                        type="button"
                        onClick={() => removeEquipement(index)}
                        className="inline-flex items-center gap-2 rounded-full bg-[#d5e8f8] px-4 py-2 text-[15px] text-[#2b2b2b] transition-all duration-150 hover:brightness-95 sm:text-[15px]"
                      >
                        {item}
                        <X className="h-3 w-3" />
                      </button>
                    ))}
                  </div>
                </label>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-[1.6fr_1fr] lg:grid-cols-[2fr_1fr]">
                <div className="anim-item">
                  <h2 className="mb-4 text-[20px] font-semibold text-[#1f1f1f]">Formule disponible</h2>
                  <div className="rounded-xl border border-transparent bg-transparent p-1">
                    <div className="flex flex-wrap gap-4">
                    {formulas.map((formula) => (
                      <button
                        key={formula}
                        type="button"
                        onClick={() => toggleFormula(formula)}
                        className={`h-[45px] min-w-[100px] rounded-xl border-2 px-3 md:min-w-[120px] md:px-3 text-[15px] transition-all duration-200 sm:text-[15px] ${
                          selectedFormula === formula
                            ? "border-[#1d7df2] bg-[#1d7df2] text-white"
                            : "border-[#1d7df2] text-[#1d7df2] hover:bg-[#eaf3ff]"
                        }`}
                      >
                        {formula}
                      </button>
                    ))}
                    </div>
                  </div>
                </div>

                <div className="anim-item ">
                  <label className="mb-2 block text-[20px] font-semibold text-[#1f1f1f]">Date</label>
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#3e3e3e]" />
                    <input
                      type="date"
                      value={dateValue}
                      onChange={(event) => setDateValue(event.target.value)}
                      className="h-[50px] w-full rounded-xl border border-[#c5c6cb] bg-[#ececf0] pl-12 pr-4 text-[15px] text-[#3e3e3e] outline-none transition-shadow duration-200 hover:shadow-sm focus:shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-10 flex flex-col justify-between gap-5 sm:flex-row">
                <button
                  type="button"
                  onClick={goPrevious}
                  className="anim-item inline-flex h-[50px] w-full items-center justify-center rounded-xl border border-[#bebec3] bg-[#f8f8f8] px-6 text-[18px] font-semibold text-[#111111] transition-colors duration-200 hover:bg-[#f1f1f1] sm:w-auto sm:min-w-[200px] lg:min-w-[230px]"
                >
                  Précédent
                </button>
                <button
                  type="submit"
                  className="anim-item inline-flex h-[50px] w-full items-center justify-center rounded-xl bg-[#0f7cff] px-6 text-[18px] font-semibold text-white transition-opacity duration-200 hover:opacity-90 sm:w-auto sm:min-w-[200px] lg:min-w-[230px]"
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

export default CreateLogementStep2;
