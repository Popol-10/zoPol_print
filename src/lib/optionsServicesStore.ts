import img1 from "@/assets/imgBougi.png";
import img2 from "@/assets/imgChamp.png";

export type TabKey = "extra" | "promo" | "gift";

export interface ExtraItem {
  id: string;
  title: string;
  description: string;
  price: string;
  category: string;
  image: string;
}

export interface PromoCodeItem {
  id: string;
  code: string;
  valeur: string;
  commandes: number;
  utilisations: number;
  date: string;
  actif: boolean;
}

export interface GiftCardItem {
  id: string;
  code: string;
  montant: string;
  soldeRestant: string;
  utilisations: number;
  date: string;
  actif: boolean;
}

export interface OptionsServicesData {
  extras: ExtraItem[];
  promoCodes: PromoCodeItem[];
  giftCards: GiftCardItem[];
}

const STORAGE_KEY = "options-services-data-v1";

const DEFAULT_DATA: OptionsServicesData = {
  extras: [
    {
      id: "1",
      title: "Bougie Led",
      description: "Description Lorem Ipsum",
      price: "20€",
      category: "Decoration",
      image: img1,
    },
    {
      id: "2",
      title: "Champagne",
      description: "Description Lorem Ipsum",
      price: "15€",
      category: "Boisson",
      image: img2,
    },
  ],
  promoCodes: [
    {
      id: "promo-1",
      code: "CODESPROM458",
      valeur: "10€",
      commandes: 1,
      utilisations: 2,
      date: "21 novembre 2025",
      actif: true,
    },
    {
      id: "promo-2",
      code: "CODESPROM560",
      valeur: "50€",
      commandes: 1,
      utilisations: 1,
      date: "21 novembre 2025",
      actif: true,
    },
  ],
  giftCards: [
    {
      id: "gift-1",
      code: "CADEAU458",
      montant: "100€",
      soldeRestant: "100€",
      utilisations: 0,
      date: "21 novembre 2025",
      actif: true,
    },
    {
      id: "gift-2",
      code: "CADEAU560",
      montant: "50€",
      soldeRestant: "50€",
      utilisations: 0,
      date: "21 novembre 2025",
      actif: true,
    },
  ],
};

export const loadOptionsServicesData = (): OptionsServicesData => {
  if (typeof window === "undefined") return DEFAULT_DATA;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DATA;
    const parsed = JSON.parse(raw) as Partial<OptionsServicesData>;
    return {
      extras: Array.isArray(parsed.extras) ? parsed.extras : DEFAULT_DATA.extras,
      promoCodes: Array.isArray(parsed.promoCodes) ? parsed.promoCodes : DEFAULT_DATA.promoCodes,
      giftCards: Array.isArray(parsed.giftCards) ? parsed.giftCards : DEFAULT_DATA.giftCards,
    };
  } catch {
    return DEFAULT_DATA;
  }
};

export const saveOptionsServicesData = (data: OptionsServicesData) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const formatIsoDateToFrench = (iso: string) => {
  if (!iso) return "";
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

export const parseFrenchDateToIso = (value?: string) => {
  if (!value) return "";
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  const match = normalized.match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/);
  if (!match) return "";
  const monthMap: Record<string, string> = {
    janvier: "01",
    fevrier: "02",
    mars: "03",
    avril: "04",
    mai: "05",
    juin: "06",
    juillet: "07",
    aout: "08",
    septembre: "09",
    octobre: "10",
    novembre: "11",
    decembre: "12",
  };
  const day = match[1].padStart(2, "0");
  const month = monthMap[match[2]];
  const year = match[3];
  if (!month) return "";
  return `${year}-${month}-${day}`;
};
