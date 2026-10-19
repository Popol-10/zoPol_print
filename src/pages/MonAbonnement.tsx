import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CreditCard, ExternalLink, FileText } from "lucide-react";
import SidebarNav from "@/components/SidebarNav";
import TopNav from "@/components/TopNav";
import ico from "@/assets/solar_tag-price-bold.png";
import { useLocation, useNavigate } from "react-router-dom";

type PlanName = "STARTER" | "SCALE" | "PRO";
type BillingMode = "mensuel" | "annuel";

interface PlanConfig {
  amount: number;
}

const planConfig: Record<PlanName, PlanConfig> = {
  STARTER: { amount: 1200 },
  SCALE: { amount: 2500 },
  PRO: { amount: 1200 },
};

const SUBSCRIPTION_STORAGE_KEY = "subscription-state";
const isPlanName = (value: unknown): value is PlanName => value === "STARTER" || value === "SCALE" || value === "PRO";
const isBillingMode = (value: unknown): value is BillingMode => value === "mensuel" || value === "annuel";
const defaultSubscription: { selectedPlan: PlanName; billingMode: BillingMode; selectedBaseAmount?: number } = {
  selectedPlan: "STARTER",
  billingMode: "mensuel",
  selectedBaseAmount: planConfig.STARTER.amount,
};

const travellerFeatures = [
  "Recherche / filtres / page logement / galerie / favoris / partage",
  "Devis & prix total (heures + frais + options)",
  "Checkout + paiement Stripe (carte) + confirmation",
  "Espace “Mon séjour” (consulter / annuler selon politique / demander modification)",
  "Espace “Mon séjour” (consulter / annuler selon politique / demander modification)",
];

const ownerFeatures = [
  "Onboarding marque : thème A/B/C, couleurs, logo, domaine/sous-domaine",
  "Connexion Stripe, pages légales, emails transactionnels",
  "Gestion logements (photos, contenus, capacité, équipements, règles, check-in/out)",
  "Tarification à l’heure + frais fixes (ménage/linge) + options (services)",
  "Calendrier interne + blocage manuel + sync iCal Airbnb/Booking",
  "Réservations : liste, détail, statuts, export CSV, remboursements (si activé)",
];

const optionFeatures = ["Module Prestataires (+49€/mois)"];

const MonAbonnement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const incomingState = (location.state as { selectedPlan?: PlanName; billingMode?: BillingMode; selectedBaseAmount?: number } | null) ?? null;

  const [subscription, setSubscription] = useState(defaultSubscription);
  const [cardEnding, setCardEnding] = useState("4242");

  const plan = subscription.selectedPlan;
  const billingMode = subscription.billingMode;
  const billingMonths = billingMode === "annuel" ? 12 : 1;
  const recurringLabel = billingMode === "annuel" ? "/an" : "/mois";

  useEffect(() => {
    const raw = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { selectedPlan?: unknown; billingMode?: unknown; selectedBaseAmount?: unknown };
      if (isPlanName(parsed.selectedPlan) && isBillingMode(parsed.billingMode)) {
        setSubscription({
          selectedPlan: parsed.selectedPlan,
          billingMode: parsed.billingMode,
          selectedBaseAmount: typeof parsed.selectedBaseAmount === "number" ? parsed.selectedBaseAmount : undefined,
        });
      }
    } catch {
      localStorage.removeItem(SUBSCRIPTION_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!isPlanName(incomingState?.selectedPlan) || !isBillingMode(incomingState?.billingMode)) return;
    setSubscription({
      selectedPlan: incomingState.selectedPlan,
      billingMode: incomingState.billingMode,
      selectedBaseAmount: incomingState.selectedBaseAmount,
    });
  }, [incomingState?.selectedPlan, incomingState?.billingMode, incomingState?.selectedBaseAmount]);

  useEffect(() => {
    localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscription));
  }, [subscription]);

  const endDateLabel = useMemo(() => {
    const now = new Date();
    now.setMonth(now.getMonth() + billingMonths);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(now);
  }, [billingMonths]);

  const baseAmount = subscription.selectedBaseAmount ?? planConfig[plan].amount;
  const planAmount = billingMode === "annuel" ? baseAmount * 10 : baseAmount;
  const priceLabel = `${planAmount.toLocaleString("fr-FR")}€`;

  const downloadInvoicePdf = () => {
    const lines = [
      "SWEETHOME - FACTURE ABONNEMENT",
      "",
      `Plan: ${plan}`,
      `Montant: ${priceLabel}${recurringLabel}`,
      `Date de fin: ${endDateLabel}`,
      `Carte: **** ${cardEnding}`,
    ];

    const stream = `BT\n/F1 12 Tf\n72 790 Td\n(${lines[0]}) Tj\n0 -20 Td\n(${lines[2]}) Tj\n0 -18 Td\n(${lines[3]}) Tj\n0 -18 Td\n(${lines[4]}) Tj\n0 -18 Td\n(${lines[5]}) Tj\nET`;
    const objects = [
      "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
      "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
      "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
      `4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`,
      "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    ];

    let pdf = "%PDF-1.4\n";
    const offsets: number[] = [];
    objects.forEach((obj) => {
      offsets.push(pdf.length);
      pdf += obj;
    });
    const xref = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.forEach((offset) => {
      pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

    const blob = new Blob([pdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `facture-${plan.toLowerCase()}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const openOffersPage = () => {
    navigate("/mon-abonnement/offres", {
      state: {
        currentPlan: plan,
        currentBillingMode: billingMode,
        currentBaseAmount: subscription.selectedBaseAmount ?? planConfig[plan].amount,
      },
    });
  };

  const updateCard = () => {
    const next = window.prompt("Entrer les 4 derniers chiffres de la carte", cardEnding);
    if (!next) return;
    const digits = next.replace(/\D/g, "").slice(-4);
    if (digits.length !== 4) {
      window.alert("Veuillez entrer 4 chiffres.");
      return;
    }
    setCardEnding(digits);
  };

  const cancelSubscription = () => {
    const ok = window.confirm("Confirmer l'annulation de l'abonnement ?");
    if (!ok) return;
    setSubscription(defaultSubscription);
    localStorage.removeItem(SUBSCRIPTION_STORAGE_KEY);
    window.alert("Abonnement annulé.");
  };

  return (
    <div className="page-shell flex min-h-screen bg-background">
      <SidebarNav />

      <main className="flex min-w-0 flex-1 flex-col gap-5 p-4 pb-8 pt-16 lg:gap-6 lg:p-6 lg:pt-6">
        <TopNav title="MON ABONNEMENT" />

        <section className="mx-auto w-full max-w-[1120px]">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.8fr_0.95fr]">
            <article className="rounded-[18px] border border-[#d4d4da] bg-white p-5 shadow-[0_30px_70px_-24px_rgba(82,96,255,0.34)] lg:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-[20px] font-bold text-[#17171c]">Votre offre actuel est “{plan}”</h2>
                  <p className="mt-2 text-[15px] text-[#2d2d35]">La validité de votre abonnement est de {billingMonths} mois</p>
                </div>
                <span className="inline-flex h-9 min-w-[116px] items-center justify-center rounded-full bg-[#177cf1] px-4 text-[15px] text-white">
                  {billingMode === "annuel" ? "Annuel" : "Mensuel"}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:max-w-[540px]">
                <div className="rounded-xl border border-[#177cf1] bg-[#e5edf7] p-4">
                  <p className="flex items-center gap-2 text-[15px] font-semibold text-[#177cf1]"><img src={ico} className="h-4 w-4" />Prix actuel</p>
                  <p className="mt-3 text-[25px] font-bold leading-none text-[#177cf1]">{priceLabel}<span className="ml-1 text-[15px] font-semibold">{recurringLabel}</span></p>
                </div>
                <div className="rounded-xl border border-[#ff2a73] bg-[#f8e7ef] p-4">
                  <p className="flex items-center gap-2 text-[15px] font-semibold text-[#ff2a73]"><CalendarDays className="h-4 w-4" />Date de fin</p>
                  <p className="mt-3 text-[25px] font-bold leading-none text-[#ff2a73]">{endDateLabel}</p>
                </div>
              </div>

              <h3 className="mt-6 text-[15px] font-bold uppercase text-[#16161b]">Inclus dans votre abonnement</h3>

              <div className="mt-4">
                <h4 className="text-[15px] font-semibold text-[#18181d]">Côté voyageur</h4>
                <div className="my-2 h-px bg-[#d8d8de]" />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-x-8">
                  {travellerFeatures.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-[15px] text-[#25252b]">
                      <span className="mt-0.5 text-[#ff2a73]">✔</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-[15px] font-semibold text-[#18181d]">Côté propriétaire</h4>
                <div className="my-2 h-px bg-[#d8d8de]" />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-x-8">
                  {ownerFeatures.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-[15px] text-[#25252b]">
                      <span className="mt-0.5 text-[#ff2a73]">✔</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-[15px] font-semibold text-[#18181d]">En option :</h4>
                <div className="my-2 h-px bg-[#d8d8de]" />
                {optionFeatures.map((item) => (
                  <div key={item} className="flex items-start gap-2 text-[15px] text-[#25252b]">
                    <span className="mt-0.5 text-[#ff2a73]">✔</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={cancelSubscription}
                  className="h-10 rounded-xl bg-[#ff1e1e] px-5 text-[15px] font-semibold text-white transition-colors hover:bg-[#da1414]"
                >
                  Annuler l'abonnement
                </button>
              </div>
            </article>

            <aside className="h-fit rounded-[18px] border border-[#d4d4da] bg-white p-5 shadow-[0_30px_70px_-24px_rgba(82,96,255,0.34)]">
              <h3 className="text-center text-[20px] font-bold text-[#17171c]">AUTRES OPTIONS</h3>
              <div className="mt-3 h-px bg-[#d8d8de]" />

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={openOffersPage}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#ff1f72] text-[15px] font-semibold text-white transition-colors hover:bg-[#e11263]"
                >
                  Changer d’abonnement
                  <ExternalLink className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={updateCard}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#e5edf7] text-[15px] font-semibold text-[#177cf1] transition-colors hover:bg-[#d8e5f5]"
                >
                  <CreditCard className="h-5 w-5" />
                  Moyen de paiement (**** {cardEnding})
                </button>

                <button
                  type="button"
                  onClick={downloadInvoicePdf}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#0f1f2a] text-[15px] font-semibold text-white transition-colors hover:bg-[#0a1822]"
                >
                  <FileText className="h-5 w-5" />
                  Télécharger les factures
                </button>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MonAbonnement;
