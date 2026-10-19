import icoP from "@/assets/icoP.png";
import icoStart from "@/assets/icoStart.png";
import icoScale from "@/assets/icoscale.png";
import SidebarNav from "@/components/SidebarNav";
import TopNav from "@/components/TopNav";
import { Check } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type BillingMode = "mensuel" | "annuel";
type OfferPlan = "STARTER" | "SCALE" | "PRO";
type SetupMode = "standard" | "express";
// new currency support
type Currency = "EUR" | "USD" | "XOF";

interface LocationState {
  currentPlan?: OfferPlan;
  currentBillingMode?: BillingMode;
  currentBaseAmount?: number;
  currency?: Currency;
}

interface OfferCardSection {
  title: string;
  items: string[];
}

const SUBSCRIPTION_STORAGE_KEY = "subscription-state";

const isOfferPlan = (value: unknown): value is OfferPlan => value === "STARTER" || value === "SCALE" || value === "PRO";
const isBillingMode = (value: unknown): value is BillingMode => value === "mensuel" || value === "annuel";

const starterSections: OfferCardSection[] = [
  {
    title: "Site & marque",
    items: [
      "Site marque blanche premium avec votre logo et favicon (3 thèmes)",
      "Domaine custom ou sous-domaine",
      "Pages : accueil, logements, réservation, contact, mentions légales, CGV, politique annulation",
      "Galerie photos optimisée mobile (plein écran)",
    ],
  },
  {
    title: "Réservation & paiement",
    items: [
      "Réservation directe sans commission",
      "Paiement Stripe (compte du client)",
      "Réservation à la nuit",
      "Réservation à l'heure (créneaux 4-6h, activable par bien)",
      "Configuration des prix (nuits + frais + options + taxes)",
      "Devis PDF avant paiement",
      "Hold 15 min pendant checkout (anti-double booking)",
      "Reçu / confirmation automatique",
    ],
  },
  {
    title: "Calendrier",
    items: [
      "Calendrier interne",
      "Blocage manuel de dates",
      "iCal 2 source par bien (Airbnb et Booking)",
      "Buffers automatiques anti-conflit",
    ],
  },
  {
    title: "SEO base",
    items: [
      "Pages logement optimisées (meta, structured data VacationRental)",
      "Sitemap automatique",
      "Core Web Vitals optimisés",
    ],
  },
  {
    title: "Guest Portal",
    items: [
      "Instructions check-in, codes d'accès (affichage 1h avant)",
      "Guide logement (WiFi, chauffage, règles)",
      "Déclaration incident en ligne",
      "Emails automatiques (confirmation, rappel, check-out)",
    ],
  },
  {
    title: "Support",
    items: ["Support email 48h", "Base de connaissances"],
  },
];

const scaleSections: OfferCardSection[] = [
  {
    title: "Multi-biens",
    items: [
      "Dashboard centralisé toutes réservations / tous biens",
      "Planning consolidé (vue semaine / mois)",
      "Duplication logement (template)",
      "Organisation par tags (ville, type, gamme)",
      "Blocage dates en masse",
      "Publier / dépublier par lot",
    ],
  },
  {
    title: "Tarification avancée",
    items: [
      "Tarifs saisonniers (haute / moyenne / basse)",
      "Tarifs weekend vs semaine",
      "Prix minimum par nuit selon période",
      "Codes promo (montant fixe ou %)",
      "Frais standardisés par catégorie",
    ],
  },
  {
    title: "Calendrier avancé",
    items: [
      "iCal multi-sources par bien (Airbnb + Booking simultanément)",
      "Détection conflits avec alerte email",
      "Règles last-minute configurables (blocage J-0, J-1)",
      "Log sync (timestamp, erreurs)",
    ],
  },
  {
    title: "Options & Upsells",
    items: [
      "Catalogue options complet (late check-out, transfert, panier, etc.)",
      "Upsells pendant checkout",
      "Upsells post-réservation depuis espace séjour",
      "Suivi ventes options (CA additionnel tracké)",
    ],
  },
  {
    title: "SEO intermédiaire",
    items: [
      "Pages zone générées (ex : Location vacances à Annecy)",
      "Maillage interne automatique entre logements",
      "Google Analytics + Search Console connectés",
      "Rapport trafic mensuel basique",
    ],
  },
  {
    title: "Communication",
    items: [
      "Templates emails/SMS personnalisables",
      "Automatisations (pré-arrivée J-3, rappel solde, feedback J+1)",
      "Inbox voyageur centralisée",
    ],
  },
  {
    title: "Support",
    items: ["Email prioritaire 24h", "1 appel onboarding 45 min"],
  },
];

const conciergeSections: OfferCardSection[] = [
  {
    title: "Opérations conciergerie",
    items: [
      "Biens illimités",
      "Import en masse CSV",
      "Affectation bien + propriétaire",
      "Multi-utilisateurs illimités",
      "Rôles avancés (remboursement, publication, blocage)",
      "Catalogue options global + spécifique par logement",
    ],
  },
  {
    title: "Module Prestataires (inclus)",
    items: [
      "Espace prestataire dédié (ménage / maintenance)",
      "Réception, acceptation, refus de missions",
      "Checklist intervention (linge, consommables, photos avant/après)",
      "Remontée incidents + photos",
      "Historique interventions",
      "Génération facture assistée IA",
    ],
  },
  {
    title: "Owner Portal (inclus)",
    items: [
      "Accès lecture seule par propriétaire",
      "Rapport mensuel automatique (occupation, CA, économies commissions)",
      "Historique réservations et documents",
    ],
  },
  {
    title: "SEO Premium",
    items: [
      "Stratégie pages villes complète (générées + optimisées)",
      "Structured data avancé (VacationRental, LocalBusiness, BreadcrumbList)",
      "Multilingue FR + EN",
      "Suivi positions + rapport mensuel SEO",
    ],
  },
  {
    title: "IA intégrée",
    items: [
      "Génération descriptions logements",
      "Templates emails/SMS générés et personnalisés",
      "Suggestions de prix basées sur l'occupation",
    ],
  },
  {
    title: "Dashboard & analytics",
    items: [
      "CA mensuel/annuel (direct vs plateformes)",
      "Taux d'occupation par bien / global",
      "Panier moyen + part options dans le CA",
      "Taux de conversion checkout",
      "Export CSV / PDF",
    ],
  },
  {
    title: "Support",
    items: [
      "Account manager dédié",
      "Réponse 4h en semaine",
      "Appels illimités (onboarding + QBR trimestriel)",
      "SLA garanti contractuellement",
    ],
  },
];

// rate values are relative to EUR
const currencyRates: Record<Currency, number> = {
  EUR: 1,
  USD: 1.1, // simple fixed rate for demonstration
  XOF: 655, // CFA franc per euro roughly
};

const formatPrice = (value: number, currency: Currency) => {
  const rate = currencyRates[currency] || 1;
  const converted = value * rate;
  const symbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : "XOF";
  // use french formatting for numbers, symbol appended
  return `${converted.toLocaleString("fr-FR")}${symbol}`;
};
const propertyCountLabel = (plan: OfferPlan) => {
  if (plan === "STARTER") return "1 à 3 biens";
  if (plan === "SCALE") return "1 à 15 biens";
  return "illimité de biens";
};

interface PlanCardProps {
  iconSrc: string;
  iconAlt: string;
  displayName: string;
  internalPlan: OfferPlan;
  selectedPlan: OfferPlan;
  subtitle: string;
  headline: string;
  includeTitle: string;
  monthlyPrice: number;
  setupStandardLabel: string;
  setupStandardPrice: number;
  setupExpressLabel: string;
  setupExpressPrice: number;
  setupDelayLine?: string;
  sections: OfferCardSection[];
  annualMode: boolean;
  setupMode: SetupMode;
  onSetupModeChange: (mode: SetupMode) => void;
  onSelectPlan: (plan: OfferPlan) => void;
  onSubscribe: (plan: OfferPlan, baseAmount: number) => void;
  canSubscribe: boolean;
  recommended?: boolean;
  extraHeaderText?: string;
  currency: Currency;
}

const PlanCard = ({
  iconSrc,
  iconAlt,
  displayName,
  internalPlan,
  selectedPlan,
  subtitle,
  headline,
  includeTitle,
  monthlyPrice,
  setupStandardLabel,
  setupStandardPrice,
  setupExpressLabel,
  setupExpressPrice,
  setupDelayLine,
  sections,
  annualMode,
  setupMode,
  onSetupModeChange,
  onSelectPlan,
  onSubscribe,
  canSubscribe,
  recommended,
  extraHeaderText,
  currency,
}: PlanCardProps) => {
  const recurringLabel = annualMode ? "/an" : "/mois";
  const multiplier = annualMode ? 10 : 1;
  const visibleMonthly = monthlyPrice * multiplier;
  const selectedSetupPrice = setupMode === "standard" ? setupStandardPrice : setupExpressPrice;

  const fmt = (amt: number) => formatPrice(amt, currency);

  return (
    <article
      onClick={() => onSelectPlan(internalPlan)}
      className={`relative rounded-[12px] border bg-[#fff] shadow-[0_28px_72px_-34px_rgba(103,113,255,0.62)] ${
        selectedPlan === internalPlan ? "border-[#157ff2]" : "border-[#d5d5db]"
      }`}
    >
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <img src={iconSrc} alt={iconAlt} className="h-[25px] w-[25px]" />
            <h3 className="text-[20px] font-bold leading-none tracking-[0.01em] text-[#17171d] sm:text-[20px] md:text-[20px] lg:text-[20px] xl:text-[19px]">
              {displayName}
            </h3>
          </div>
          {recommended ? <span className="rounded-full bg-black px-3 py-1 text-[11px] font-semibold leading-none text-white">Recommandé</span> : null}
        </div>

        <p className="mt-7 text-[16px] font-bold uppercase leading-[1.25] text-[#202026]">{subtitle}</p>

        <p className="mt-6 text-[20px] leading-none text-[#141419] sm:text-[20px] md:text-[20px] lg:text-[15px]">
          <span className="mr-2 text-[20px] font-medium sm:text-[20px] md:text-[20px] lg:text-[20px]">{headline}</span>
          <span className="text-[20px] font-bold sm:text-[20px] md:text-[20px] lg:text-[20px]">{fmt(visibleMonthly)}</span>
          <span className="ml-2 text-[20px] font-semibold sm:text-[20px] md:text-[20px] lg:text-[20px]">{recurringLabel}</span>
        </p>

        {extraHeaderText ? <p className="mt-5 text-[14px] leading-[1.35] text-[#23232a]">{extraHeaderText}</p> : null}

        <div className="mt-8 space-y-2 text-[14px] leading-[1.25] text-[#1f1f26]">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="radio"
              name={`setup-${internalPlan}`}
              checked={setupMode === "standard"}
              onChange={() => {
                onSelectPlan(internalPlan);
                onSetupModeChange("standard");
              }}
              className="h-[16px] w-[16px]"
            />
            <span className="font-semibold italic text-[#1f80ff]">{setupStandardLabel}</span>
            <span className="ml-2 text-[14px] font-bold leading-none">{fmt(setupStandardPrice * multiplier)}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="radio"
              name={`setup-${internalPlan}`}
              checked={setupMode === "express"}
              onChange={() => {
                onSelectPlan(internalPlan);
                onSetupModeChange("express");
              }}
              className="h-[16px] w-[16px]"
            />
            <span className="font-bold italic">{setupExpressLabel}</span>
            <span className="ml-2 text-[14px] font-bold leading-none">{fmt(setupExpressPrice * multiplier)}</span>
          </label>
          {setupDelayLine ? <p className="pl-[28px] text-[14px] italic text-[#303038]">{setupDelayLine}</p> : null}
        </div>
      </div>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          if (!canSubscribe) return;
          onSubscribe(internalPlan, selectedSetupPrice);
        }}
        disabled={!canSubscribe}
        className={`mx-[10px] mt-2 h-[58px] w-[calc(100%-20px)] rounded-[11px] text-[17px] font-medium text-white transition-colors ${
          canSubscribe ? "bg-[#ff1e73] hover:bg-[#e31265]" : "cursor-not-allowed bg-[#b0b0b6]"
        }`}
      >
        Souscrire
      </button>
      {!canSubscribe ? (
        <p className="px-6 pt-2 text-[12px] text-[#5d5d66]">
          Ce plan n&apos;est pas disponible pour {propertyCountLabel(internalPlan)}.
        </p>
      ) : null}

      <div className="px-6 pb-7 pt-7">
        <h4 className="text-[18px] font-bold uppercase leading-none text-[#1b1b20]">{includeTitle}</h4>
        {sections.map((section) => (
          <div key={`${internalPlan}-${section.title}`} className="mt-8">
            <h5 className="text-[15px] font-semibold leading-none text-[#222228]">{section.title}</h5>
            <div className="mt-4 h-px bg-[#dddddf]" />
            <div className="mt-5 space-y-3">
              {section.items.map((item) => (
                <div key={item} className="flex items-start gap-3 text-[14px] leading-[1.14] text-[#27272e]">
                  <Check className="mt-1 h-[18px] w-[18px] shrink-0 text-[#ff2a7b]" strokeWidth={3} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
};

const MonAbonnementOffres = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState | null) ?? {};

  const storedRaw = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
  let storedPlan: OfferPlan | undefined;
  let storedBilling: BillingMode | undefined;
  let storedCurrency: Currency | undefined;

  if (storedRaw) {
    try {
      const parsed = JSON.parse(storedRaw) as { selectedPlan?: unknown; billingMode?: unknown; currency?: unknown };
      if (isOfferPlan(parsed.selectedPlan)) {
        storedPlan = parsed.selectedPlan;
      }
      if (isBillingMode(parsed.billingMode)) {
        storedBilling = parsed.billingMode;
      }
      if (parsed.currency === "EUR" || parsed.currency === "USD" || parsed.currency === "XOF") {
        storedCurrency = parsed.currency;
      }
    } catch {
      localStorage.removeItem(SUBSCRIPTION_STORAGE_KEY);
    }
  }

  const [billingMode, setBillingMode] = useState<BillingMode>(state.currentBillingMode ?? storedBilling ?? "mensuel");
  const [selectedPlan, setSelectedPlan] = useState<OfferPlan>(state.currentPlan ?? storedPlan ?? "STARTER");
  const [propertyCount, setPropertyCount] = useState<number>(3);
  // currency state for price conversion
  const [currency, setCurrency] = useState<Currency>(state.currency ?? storedCurrency ?? "EUR");

  const [starterSetup, setStarterSetup] = useState<SetupMode>("standard");
  const [scaleSetup, setScaleSetup] = useState<SetupMode>("standard");
  const [conciergeSetup, setConciergeSetup] = useState<SetupMode>("standard");

  const annualMode = useMemo(() => billingMode === "annuel", [billingMode]);
  const isAtMinProperties = propertyCount <= 1;
  const isAtMaxProperties = propertyCount >= 99;
  const starterEligible = propertyCount >= 1 && propertyCount <= 3;
  const scaleEligible = propertyCount >= 1 && propertyCount <= 15;
  const conciergeEligible = propertyCount >= 1;

  const changePropertyCount = (delta: number) => {
    setPropertyCount((prev) => Math.min(99, Math.max(1, prev + delta)));
  };

  const subscribe = (plan: OfferPlan, selectedBaseAmount: number) => {
    setSelectedPlan(plan);
    localStorage.setItem(
      SUBSCRIPTION_STORAGE_KEY,
      JSON.stringify({ selectedPlan: plan, billingMode, selectedBaseAmount, propertyCount, currency }),
    );
    navigate("/mon-abonnement", { state: { selectedPlan: plan, billingMode, selectedBaseAmount, currency } });
  };

  return (
    <div className="page-shell flex min-h-screen bg-background">
      <SidebarNav />

      <main className="flex min-w-0 flex-1 flex-col gap-5 p-4 pb-8 pt-16 lg:gap-6 lg:p-6 lg:pt-6">
        <TopNav title="MON ABONNEMENT" />

        <section className="mx-auto w-full max-w-[1260px] space-y-5">
          <div className="flex flex-wrap items-end justify-center gap-x-16 gap-y-4">
            <div className="text-center">
              <p className="mb-2 text-[16px] font-semibold text-[#1a1a20]">Sélectionner un plan</p>
              <div className="rounded-[12px] border border-[#d7d7de] bg-white p-[6px] shadow-[0_20px_50px_-24px_rgba(112,123,255,0.55)]">
                <div className="grid grid-cols-2 gap-[4px]">
                  <button
                    type="button"
                    onClick={() => setBillingMode("mensuel")}
                    className={`h-[43px] min-w-[130px] rounded-[8px] text-[14px] font-semibold transition-colors ${
                      billingMode === "mensuel" ? "bg-[#167ef1] text-white" : "bg-[#f0f0f2] text-[#1a1a20]"
                    }`}
                  >
                    Mensuel
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingMode("annuel")}
                    className={`h-[43px] min-w-[130px] rounded-[8px] text-[14px] font-semibold transition-colors ${
                      billingMode === "annuel" ? "bg-[#167ef1] text-white" : "bg-[#f0f0f2] text-[#1a1a20]"
                    }`}
                  >
                    Annuel (-17%)
                  </button>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="mb-2 text-[16px] font-semibold text-[#1a1a20]">Nombre de biens</p>
              <div className="inline-flex items-center gap-[6px] rounded-[10px] border border-[#d7d7de] bg-white p-[6px] shadow-[0_20px_50px_-24px_rgba(112,123,255,0.55)]">
                <button
                  type="button"
                  onClick={() => changePropertyCount(-1)}
                  disabled={isAtMinProperties}
                  className={`grid h-[40px] w-[40px] place-items-center rounded-[6px] text-[30px] leading-none text-white ${
                    isAtMinProperties ? "cursor-not-allowed bg-[#7f7f87]" : "bg-[#17171d]"
                  }`}
                >
                  -
                </button>
                <div className="grid h-[40px] w-[44px] place-items-center rounded-[6px] border border-[#d8d8dc] bg-[#f6f6f8] text-[25px] font-bold text-[#16161c]">
                  {String(propertyCount).padStart(2, "0")}
                </div>
                <button
                  type="button"
                  onClick={() => changePropertyCount(1)}
                  disabled={isAtMaxProperties}
                  className={`grid h-[40px] w-[40px] place-items-center rounded-[6px] text-[30px] leading-none text-white ${
                    isAtMaxProperties ? "cursor-not-allowed bg-[#7f7f87]" : "bg-[#17171d]"
                  }`}
                >
                  +
                </button>
              </div>
            </div>

            {/* currency selector */}
            <div className="text-center">
              <p className="mb-2 text-[16px] font-semibold text-[#1a1a20]">Devise</p>
              <div className="rounded-[12px] border border-[#d7d7de] bg-white p-[6px] shadow-[0_20px_50px_-24px_rgba(112,123,255,0.55)]">
                <div className="grid grid-cols-3 gap-[4px]">
                  <button
                    type="button"
                    onClick={() => setCurrency("EUR")}
                    className={`h-[43px] min-w-[90px] rounded-[8px] text-[14px] font-semibold transition-colors ${
                      currency === "EUR" ? "bg-[#167ef1] text-white" : "bg-[#f0f0f2] text-[#1a1a20]"
                    }`}
                  >
                    €
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency("USD")}
                    className={`h-[43px] min-w-[90px] rounded-[8px] text-[14px] font-semibold transition-colors ${
                      currency === "USD" ? "bg-[#167ef1] text-white" : "bg-[#f0f0f2] text-[#1a1a20]"
                    }`}
                  >
                    $
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency("XOF")}
                    className={`h-[43px] min-w-[90px] rounded-[8px] text-[14px] font-semibold transition-colors ${
                      currency === "XOF" ? "bg-[#167ef1] text-white" : "bg-[#f0f0f2] text-[#1a1a20]"
                    }`}
                  >
                    XOF
                  </button>
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-[20px] font-bold text-[#17171d]">Formule disponible</h2>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <PlanCard
              iconSrc={icoStart}
              iconAlt="Starter"
              displayName="STARTER"
              internalPlan="STARTER"
              selectedPlan={selectedPlan}
              subtitle="STARTER: 1 a 3 biens"
              headline="A partir de"
              includeTitle="CE QUI EST INCLUS"
              monthlyPrice={197}
              setupStandardLabel="Setup standard"
              setupStandardPrice={1500}
              setupExpressLabel="Livraison Express"
              setupExpressPrice={2500}
              setupDelayLine="Délai de livraison : 7 jours"
              sections={starterSections}
              annualMode={annualMode}
              setupMode={starterSetup}
              onSetupModeChange={setStarterSetup}
              onSelectPlan={setSelectedPlan}
              onSubscribe={subscribe}
              canSubscribe={starterEligible}
              currency={currency}
            />

            <PlanCard
              iconSrc={icoScale}
              iconAlt="Scale"
              displayName="SCALE"
              internalPlan="SCALE"
              selectedPlan={selectedPlan}
              subtitle="SCALE: 1 a 15 biens"
              headline="A partir de"
              includeTitle="CE QUI EST INCLUS (STARTER +)"
              monthlyPrice={297}
              setupStandardLabel="Setup standard"
              setupStandardPrice={2500}
              setupExpressLabel="Livraison Express"
              setupExpressPrice={3500}
              setupDelayLine="Délai de livraison : 7 jours"
              sections={scaleSections}
              annualMode={annualMode}
              setupMode={scaleSetup}
              onSetupModeChange={setScaleSetup}
              onSelectPlan={setSelectedPlan}
              onSubscribe={subscribe}
              canSubscribe={scaleEligible}
              recommended
              currency={currency}
            />

            <PlanCard
              iconSrc={icoP}
              iconAlt="Conciergerie"
              displayName="CONCIERGERIE"
              internalPlan="PRO"
              selectedPlan={selectedPlan}
              subtitle="CONCIERGERIE: illimite"
              headline="Sur devis à partir de"
              includeTitle="CE QUI EST INCLUS (SCALE +)"
              monthlyPrice={1100}
              setupStandardLabel="Setup White Glove (Standard)"
              setupStandardPrice={4500}
              setupExpressLabel="Livraison Express"
              setupExpressPrice={6000}
              setupDelayLine="Livré en 7 jours"
              sections={conciergeSections}
              annualMode={annualMode}
              setupMode={conciergeSetup}
              onSetupModeChange={setConciergeSetup}
              onSelectPlan={setSelectedPlan}
              onSubscribe={subscribe}
              canSubscribe={conciergeEligible}
              extraHeaderText="Inclus : setup technique  complet + copywriting tous logements + organisation photos + SEO initial + 30 jours accompagnement dédié"
              currency={currency}
            />
          </div>
        </section>
      </main>
    </div>
  );
};

export default MonAbonnementOffres;
