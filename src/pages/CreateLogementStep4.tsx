import SidebarNav from "@/components/SidebarNav";
import TopNav from "@/components/TopNav";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearLogementDraft, loadLogementDraft, saveLogementDraft } from "@/lib/logementDraft";
import { toast } from "@/components/ui/use-toast";
import { addLogementFromDraft, updateLogementFromDraft } from "@/lib/logementsStore";

const currentStep = 4;

const CreateLogementStep4 = () => {
  const navigate = useNavigate();
  const draft = loadLogementDraft();
  const isEditMode = Boolean(draft.editingLogementId);
  const [rules, setRules] = useState(draft.rules);

  const goPrevious = () => {
    saveLogementDraft({ rules: rules.trim() });
    navigate("/logements/create/step-3");
  };

  const handleCreate = () => {
    saveLogementDraft({ rules: rules.trim() });
    const finalDraft = loadLogementDraft();
    if (finalDraft.editingLogementId) {
      updateLogementFromDraft(finalDraft.editingLogementId, finalDraft);
    } else {
      addLogementFromDraft(finalDraft);
    }
    toast({
      title: finalDraft.editingLogementId ? "Logement modifié" : "Logement créé",
      description: `${finalDraft.name || "Votre logement"} a été enregistré avec succès.`,
    });
    clearLogementDraft();
    navigate("/logements");
  };

  return (
    <div className="page-shell flex min-h-screen bg-[#eeeff7]">
      <SidebarNav />

      <main className="flex-1 min-w-0 p-4 pt-16 lg:p-6 lg:pl-6 lg:pt-6">
        <div className="mx-auto w-full max-w-[1400px]">
          <TopNav title="CREER UN LOGEMENT" />

          <section className="anim-item mt-7 rounded-2xl border border-[#d0d1dc] bg-[#fff] px-4 py-8 sm:px-8 md:px-10 lg:px-20 lg:py-12">
            <header className="text-center">
              <h1 className="text-[25px] font-bold text-[#101010] sm:text-[33px]">ETAPE 4</h1>
              <p className="mt-2 text-[18px] font-semibold text-[#111111] sm:text-[25px]">Options supplémentaire et règles</p>
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

            <div className="mt-10">
              <label htmlFor="regles" className="mb-2 block text-[20px] font-semibold text-[#1f1f1f]">
                Règles
              </label>
              <textarea
                id="regles"
                rows={6}
                placeholder="Ajouter une règle pour votre logement"
                value={rules}
                onChange={(event) => setRules(event.target.value)}
                className="anim-item min-h-[170px] w-full resize-none rounded-xl border border-[#c5c6cb] bg-[#ececf0] px-6 py-4 text-[10px] text-[#404040] placeholder:text-[#4d4d4d] outline-none transition-shadow duration-200 hover:shadow-sm focus:shadow-sm sm:min-h-[220px] sm:text-[15px]"
              />
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
                type="button"
                onClick={handleCreate}
                className="anim-item h-[50px] w-full rounded-xl bg-[#ff1f72] px-6 text-[18px] font-semibold text-white transition-opacity duration-200 hover:opacity-90 sm:w-auto sm:min-w-[230px] lg:min-w-[300px]"
              >
                {isEditMode ? "Modifier mon logement" : "Créer mon logement"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default CreateLogementStep4;
