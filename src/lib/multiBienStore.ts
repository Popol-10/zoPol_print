import villa1 from "@/assets/villa1.png";
import villa2 from "@/assets/villa2.png";
import villa3 from "@/assets/villa3.png";

export const MULTI_BIEN_STORAGE_KEY = "multi-bien-items-v1";

export type MultiBienStatus = "Publié" | "Brouillon";

export interface MultiBienItem {
  id: string;
  image: string;
  property: string;
  city: string;
  status: MultiBienStatus;
  basePrice: string;
  occupancy: string;
  monthlyRevenue: string;
  propertyType: string;
  photos: string[];
}

export const defaultMultiBienItems: MultiBienItem[] = [
  {
    id: "preset-1",
    image: villa1,
    property: "Appartement\nLorem ipsum",
    city: "St Raphael",
    status: "Publié",
    basePrice: "100€/nuit",
    occupancy: "80%",
    monthlyRevenue: "10250€",
    propertyType: "Appartement",
    photos: [villa1],
  },
  {
    id: "preset-2",
    image: villa2,
    property: "Studio Dolor sit",
    city: "Ville Lorem",
    status: "Publié",
    basePrice: "100€/nuit",
    occupancy: "50%",
    monthlyRevenue: "42250€",
    propertyType: "Studio",
    photos: [villa2],
  },
  {
    id: "preset-3",
    image: villa3,
    property: "Villa Nunc Elit",
    city: "Rue Dolor",
    status: "Publié",
    basePrice: "100€/nuit",
    occupancy: "30%",
    monthlyRevenue: "32250€",
    propertyType: "Villa",
    photos: [villa3],
  },
];

const normalizeItem = (item: Partial<MultiBienItem>): MultiBienItem => {
  const firstPhoto = item.photos?.[0] || item.image || "/placeholder.svg";
  return {
    id: item.id || `custom-${Date.now()}`,
    image: firstPhoto,
    property: item.property || "Nouveau bien",
    city: item.city || "Ville",
    status: item.status === "Brouillon" ? "Brouillon" : "Publié",
    basePrice: item.basePrice || "0€/nuit",
    occupancy: item.occupancy || "0%",
    monthlyRevenue: item.monthlyRevenue || "0€",
    propertyType: item.propertyType || "Appartement",
    photos: (item.photos && item.photos.length ? item.photos : [firstPhoto]).slice(0, 20),
  };
};

const dedupeById = (items: MultiBienItem[]): MultiBienItem[] => {
  const map = new Map<string, MultiBienItem>();
  items.forEach((item) => {
    map.set(item.id, item);
  });
  return Array.from(map.values());
};

export const loadMultiBienItems = (): MultiBienItem[] => {
  if (typeof window === "undefined") {
    return defaultMultiBienItems;
  }

  try {
    const raw = window.localStorage.getItem(MULTI_BIEN_STORAGE_KEY);
    if (!raw) {
      return defaultMultiBienItems;
    }

    const parsed = JSON.parse(raw) as Partial<MultiBienItem>[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return defaultMultiBienItems;
    }

    return dedupeById(parsed.map(normalizeItem));
  } catch {
    return defaultMultiBienItems;
  }
};

export const saveMultiBienItems = (items: MultiBienItem[]) => {
  if (typeof window === "undefined") {
    return;
  }

  const next = dedupeById(items.map(normalizeItem));
  window.localStorage.setItem(MULTI_BIEN_STORAGE_KEY, JSON.stringify(next));
};

export const upsertMultiBienItem = (item: Partial<MultiBienItem> & { id?: string }) => {
  const current = loadMultiBienItems();
  const normalized = normalizeItem(item);
  const existingIndex = current.findIndex((candidate) => candidate.id === normalized.id);

  if (existingIndex === -1) {
    saveMultiBienItems([...current, normalized]);
    return normalized;
  }

  const next = [...current];
  next[existingIndex] = normalized;
  saveMultiBienItems(next);
  return normalized;
};

export const getMultiBienById = (id: string) => loadMultiBienItems().find((item) => item.id === id) ?? null;
