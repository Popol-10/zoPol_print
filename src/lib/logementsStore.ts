import villa1 from "@/assets/villa1.png";
import villa2 from "@/assets/villa2.png";
import villa3 from "@/assets/villa3.png";
import villa4 from "@/assets/villa4.png";
import villa5 from "@/assets/villa5.png";
import villa6 from "@/assets/villa6.png";
import type { LogementDraft } from "@/lib/logementDraft";

export interface LogementItem {
  id: number;
  images: string[];
  title: string;
  capacity: string;
  published: boolean;
  type?: string;
  address?: string;
  city?: string;
  country?: string;
  description?: string;
  bedrooms?: number;
  bathrooms?: number;
  beds?: number;
  equipements?: string[];
  formulas?: string[];
  availableFrom?: string;
  rules?: string;
}

const LOGEMENTS_STORAGE_KEY = "logements-list-v1";

const defaultLogements: LogementItem[] = [
  {
    id: 1,
    images: [villa1, villa2, villa3],
    title: "Appartement B",
    capacity: "Capacité : 5 personnes",
    published: true,
  },
  {
    id: 2,
    images: [villa2, villa3, villa4],
    title: "Villa D",
    capacity: "Capacité : 6 personnes",
    published: false,
  },
  {
    id: 3,
    images: [villa3, villa4, villa5],
    title: "Studio A",
    capacity: "Capacité : 10 personnes",
    published: false,
  },
  {
    id: 4,
    images: [villa4, villa5, villa6],
    title: "Appartement A",
    capacity: "Capacité : 7 personnes",
    published: true,
  },
  {
    id: 5,
    images: [villa5, villa6, villa1],
    title: "Studio B",
    capacity: "Capacité : 8 personnes",
    published: false,
  },
  {
    id: 6,
    images: [villa6, villa1, villa2],
    title: "Villa E",
    capacity: "Capacité : 9 personnes",
    published: true,
  },
  {
    id: 7,
    images: [villa6, villa5, villa4],
    title: "Villa E",
    capacity: "Capacité : 9 personnes",
    published: true,
  },
  {
    id: 8,
    images: [villa6, villa4, villa2],
    title: "Villa E",
    capacity: "Capacité : 9 personnes",
    published: true,
  },
  {
    id: 9,
    images: [villa6, villa3, villa1],
    title: "Villa E",
    capacity: "Capacité : 9 personnes",
    published: true,
  },
];

export const loadLogements = (): LogementItem[] => {
  if (typeof window === "undefined") return defaultLogements;

  try {
    const raw = window.localStorage.getItem(LOGEMENTS_STORAGE_KEY);
    if (!raw) return defaultLogements;
    const parsed = JSON.parse(raw) as LogementItem[];
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultLogements;
    return parsed;
  } catch {
    return defaultLogements;
  }
};

export const saveLogements = (items: LogementItem[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOGEMENTS_STORAGE_KEY, JSON.stringify(items));
};

export const addLogementFromDraft = (draft: LogementDraft): LogementItem => {
  const current = loadLogements();
  const nextId = current.length ? Math.max(...current.map((item) => item.id)) + 1 : 1;

  const normalizedCapacity = draft.capacity.trim() || "1";
  const normalizedTitle = draft.name.trim() || "Nouveau logement";
  const normalizedImages = draft.photos.length ? draft.photos : ["/placeholder.svg"];

  const nextItem: LogementItem = {
    id: nextId,
    images: normalizedImages,
    title: normalizedTitle,
    capacity: `Capacité : ${normalizedCapacity} personnes`,
    published: true,
    type: draft.type,
    address: draft.address,
    city: draft.city,
    country: draft.country,
    description: draft.description,
    bedrooms: draft.bedrooms,
    bathrooms: draft.bathrooms,
    beds: draft.beds,
    equipements: draft.equipements,
    formulas: draft.formulas,
    availableFrom: draft.availableFrom,
    rules: draft.rules,
  };

  saveLogements([nextItem, ...current]);
  return nextItem;
};

export const getLogementById = (id: number): LogementItem | null => {
  return loadLogements().find((item) => item.id === id) ?? null;
};

export const updateLogementFromDraft = (id: number, draft: LogementDraft): LogementItem | null => {
  const current = loadLogements();
  const existing = current.find((item) => item.id === id);
  if (!existing) return null;

  const normalizedCapacity = draft.capacity.trim() || "1";
  const normalizedTitle = draft.name.trim() || existing.title;
  const normalizedImages = draft.photos.length ? draft.photos : existing.images;

  const updated: LogementItem = {
    ...existing,
    images: normalizedImages,
    title: normalizedTitle,
    capacity: `Capacité : ${normalizedCapacity} personnes`,
    type: draft.type,
    address: draft.address,
    city: draft.city,
    country: draft.country,
    description: draft.description,
    bedrooms: draft.bedrooms,
    bathrooms: draft.bathrooms,
    beds: draft.beds,
    equipements: draft.equipements,
    formulas: draft.formulas,
    availableFrom: draft.availableFrom,
    rules: draft.rules,
  };

  saveLogements(current.map((item) => (item.id === id ? updated : item)));
  return updated;
};

export const buildDraftFromLogement = (item: LogementItem): Partial<LogementDraft> => {
  const capacityMatch = item.capacity.match(/\d+/);
  const inferredType = item.title.toLowerCase().includes("villa")
    ? "Villa"
    : item.title.toLowerCase().includes("studio")
      ? "Studio"
      : "Appartement";

  return {
    editingLogementId: item.id,
    type: item.type || inferredType,
    name: item.title,
    capacity: capacityMatch?.[0] || "",
    address: item.address || "",
    city: item.city || "",
    country: item.country || "🇫🇷 France",
    description: item.description || "",
    bedrooms: item.bedrooms ?? 1,
    bathrooms: item.bathrooms ?? 1,
    beds: item.beds ?? 1,
    equipements: item.equipements ?? ["Piscine", "Terrasse", "Sauna"],
    formulas: item.formulas ?? [],
    availableFrom: item.availableFrom || new Date().toISOString().slice(0, 10),
    photos: item.images,
    rules: item.rules || "",
  };
};
