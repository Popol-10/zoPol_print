import { useMemo, useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import SidebarNav from "@/components/SidebarNav";
import TopNav from "@/components/TopNav";
import ico from "@/assets/material-icon-theme_pdf.png";

const emailOptions = [
  "Confirmation réservation",
  "Pré-arrivée",
  "Annulation",
  "Upsell",
  "Rappel paiement",
];

const policyDetails: Record<string, string> = {
  "Dépot de garanties":
    "Le dépôt est capturé avant l’arrivée et restitué automatiquement après vérification de l’état du logement.",
  Flexible:
    "Annulation gratuite jusqu’à 24h avant l’arrivée, puis frais de 50% sur la première nuit.",
  "Modérée":
    "Annulation remboursée à 50% jusqu’à 5 jours avant l’arrivée, puis non remboursable.",
  Stricte:
    "Toute annulation à moins de 14 jours est non remboursable, sauf cas de force majeure.",
};

const mailTemplates: Record<string, string> = {
  "Confirmation réservation":
    "Dorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Curabitur tempus urna at turpis condimentum lobortis.",
  "Pré-arrivée":
    "Bonjour, votre arrivée est proche. Retrouvez vos informations d’accès, horaires et coordonnées utiles pour un check-in fluide.",
  Annulation:
    "Votre demande d’annulation a bien été prise en compte. Les conditions de remboursement applicables sont détaillées ci-dessous.",
  Upsell:
    "Améliorez votre séjour avec nos options: check-in anticipé, late check-out, package romantique et services premium.",
  "Rappel paiement":
    "Un solde reste à régler pour confirmer votre réservation. Merci d’effectuer le paiement avant l’échéance indiquée.",
};

const Business = () => {
  const [cancellationPolicy, setCancellationPolicy] = useState("Dépot de garanties");
  const [autoRefund, setAutoRefund] = useState(true);
  const [rulesText, setRulesText] = useState("");
  const [selectedMail, setSelectedMail] = useState<string>("Confirmation réservation");
  const [enabledMails, setEnabledMails] = useState<string[]>(["Confirmation réservation"]);
  const [mailContent, setMailContent] = useState(mailTemplates["Confirmation réservation"]);
  const [checkInTime, setCheckInTime] = useState("16:00");
  const [checkOutTime, setCheckOutTime] = useState("11:00");
  const [isOptimizing, setIsOptimizing] = useState(false);

  const selectedMailDescription = useMemo(() => {
    return mailContent;
  }, [mailContent]);

  const toggleMail = (value: string) => {
    setEnabledMails((prev) => {
      if (!prev.includes(value)) return [...prev, value];
      if (prev.length === 1 && prev.includes(value)) return prev;
      return prev.filter((item) => item !== value);
    });
    setSelectedMail(value);
    setMailContent(mailTemplates[value]);
  };

  const optimizeTemplate = () => {
    setIsOptimizing(true);
    const optimized = `Bonjour, ceci est une version optimisée du message "${selectedMail}".\n\n${mailTemplates[selectedMail]}.\n\nNous avons simplifié le ton, clarifié les étapes et renforcé l’appel à l’action pour améliorer le taux de lecture.`;
    setTimeout(() => {
      setMailContent(optimized);
      setIsOptimizing(false);
    }, 350);
  };

  const openPolicyPdfPreview = () => {
    const content = [
      "SWEETHOME - APERCU POLITIQUES",
      "",
      `Politique d'annulation: ${cancellationPolicy}`,
      `Remboursement automatique: ${autoRefund ? "Actif" : "Inactif"}`,
      `Check-in: ${checkInTime}`,
      `Check-out: ${checkOutTime}`,
      "",
      "Reglement interieur:",
      rulesText,
    ].join("\n");

    const file = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(file);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  return (
    <div className="page-shell flex min-h-screen bg-background">
      <SidebarNav />

      <main className="flex min-w-0 flex-1 flex-col gap-5 p-4 pb-8 pt-16 lg:gap-6 lg:p-6 lg:pt-6">
        <TopNav title="BUSINESS" />

        <section className="mx-auto w-full max-w-[1120px] space-y-5">
          <div className="grid grid-cols-1 gap-5 rounded-[18px] border border-[#d4d4da] bg-[#fff] p-5 shadow-[0_30px_70px_-24px_rgba(82,96,255,0.34)] lg:grid-cols-[1.05fr_1fr] lg:p-7">
            <div className="space-y-4">
              <h3 className="text-[15px] font-bold uppercase tracking-[0.02em] text-[#141419]">Politiques</h3>

              <div>
                <label className="mb-1.5 block text-[15px] font-semibold text-[#23232a]">Politique d’annulation</label>
                <div className="relative">
                  <select
                    value={cancellationPolicy}
                    onChange={(e) => setCancellationPolicy(e.target.value)}
                    className="h-12 w-full appearance-none rounded-xl border border-[#ceced5] bg-[#ececf0] px-4 pr-10 text-[15px] text-[#2b2b31]"
                  >
                    <option value="Dépot de garanties">Dépot de garanties</option>
                    <option value="Flexible">Flexible</option>
                    <option value="Modérée">Modérée</option>
                    <option value="Stricte">Stricte</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-black" />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-[15px] font-semibold text-[#18181d]">Règle de remboursement automatique</p>
                <button
                  type="button"
                  onClick={() => setAutoRefund((prev) => !prev)}
                  className="relative h-9 w-[62px] rounded-full bg-[#d4d4d8] p-1"
                  aria-label="Activer la règle de remboursement automatique"
                >
                  <span
                    className={`block h-7 w-7 rounded-full bg-[#0f7bf1] transition-transform ${
                      autoRefund ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="mb-1.5 block text-[15px] font-semibold text-[#23232a]">Règlement intérieur</label>
                <textarea
                  value={rulesText}
                  placeholder=" Lorem ipsum dolor sit amet, consectetur adipisicing . . ."
                  onChange={(e) => setRulesText(e.target.value)}
                  className="h-[158px] w-full resize-none rounded-xl border border-[#ceced5] bg-[#ececf0] px-4 py-3 text-[15px] text-[#2b2b31]"
                />
              </div>
            </div>

            <div className="rounded-2xl bg-[#efeff3] p-5">
              <h4 className="text-[15px] font-bold uppercase leading-tight text-[#16161b]">
                RÈGLES REMBOURSEMENT AUTOMATIQUE
              </h4>

              <p className="mt-4 text-[15px] leading-relaxed text-[#2b2b31]">
                {policyDetails[cancellationPolicy]}
              </p>

              <div className="mt-6 flex items-end gap-4">
                <div>
                  <p className="mb-1 text-[15px] font-semibold text-[#191920]">Check-in</p>
                  <input
                    type="time"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    className="h-9 min-w-[96px] rounded-xl border border-[#c9c9d0] bg-[#ececf0] px-2 text-center text-[15px] text-[#23232a]"
                  />
                </div>
                <div>
                  <p className="mb-1 text-[15px] font-semibold text-[#191920]">Check-out</p>
                  <input
                    type="time"
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                    className="h-9 min-w-[96px] rounded-xl border border-[#c9c9d0] bg-[#ececf0] px-2 text-center text-[15px] text-[#23232a]"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={openPolicyPdfPreview}
                className="mt-8 flex h-[90px] w-full items-center justify-center gap-3 rounded-xl border border-[#cfcfd6] bg-[#f8f8fa] text-xl font-semibold text-[#191920] transition-colors hover:bg-[#efeff4]"
              >
                Voir un apercue PDF
                <img src={ico} className="h-8 w-8 text-[#eb1111]" />
              </button>
            </div>
          </div>

          <div className="rounded-[18px] border border-[#d4d4da] bg-[#fff] p-5 shadow-[0_30px_70px_-24px_rgba(82,96,255,0.34)] lg:p-7">
            <h3 className="text-[15px] font-bold uppercase tracking-[0.02em] text-[#141419]">Configuration mails et sms</h3>

            <div className="mt-3 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.6fr]">
              <div className="space-y-3">
                {emailOptions.map((option) => {
                  const isEnabled = enabledMails.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleMail(option)}
                      className="flex items-center gap-3 text-left"
                    >
                      <span
                        className={`grid h-7 w-7 place-items-center rounded-md border border-[#acacb3] text-sm ${
                          isEnabled ? "bg-[#f3f3f6] text-black" : "bg-transparent text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                      <span className="text-[15px] text-[#212127]">{option}</span>
                    </button>
                  );
                })}
              </div>

              <div>
                <h4 className="text-[15px] font-bold text-[#0f7bf1]">{selectedMail}</h4>
                <div className="mt-2 rounded-2xl bg-[#ececf0] p-5">
                  <p className="text-[15px] leading-relaxed text-[#303038]">{selectedMailDescription}</p>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={optimizeTemplate}
                    disabled={isOptimizing}
                    className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#0f7bf1] px-6 text-xl font-semibold text-white transition-colors hover:bg-[#0c69cf] disabled:opacity-60"
                  >
                    <Sparkles className="h-5 w-5" />
                    {isOptimizing ? "Optimisation..." : "Optimiser avec IA"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Business;
