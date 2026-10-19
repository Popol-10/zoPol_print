export const LOGEMENT_DRAFT_STORAGE_KEY = "create-logement-draft-v1";

export interface LogementDraft {
  editingLogementId: number | null;
  type: string;
  name: string;
  capacity: string;
  address: string;
  city: string;
  country: string;
  description: string;
  bedrooms: number;
  bathrooms: number;
  beds: number;
  equipements: string[];
  formulas: string[];
  availableFrom: string;
  photos: string[];
  rules: string;
}

const getTodayDate = () => new Date().toISOString().slice(0, 10);

export const createDefaultLogementDraft = (): LogementDraft => ({
  editingLogementId: null,
  type: "Appartement",
  name: "",
  capacity: "",
  address: "",
  city: "",
  country: "🇫🇷 France",
  description: "",
  bedrooms: 1,
  bathrooms: 1,
  beds: 1,
  equipements: ["Piscine", "Terrasse", "Sauna"],
  formulas: [],
  availableFrom: getTodayDate(),
  photos: [],
  rules: "",
});

export const loadLogementDraft = (): LogementDraft => {
  if (typeof window === "undefined") {
    return createDefaultLogementDraft();
  }

  try {
    const raw = window.localStorage.getItem(LOGEMENT_DRAFT_STORAGE_KEY);
    if (!raw) {
      return createDefaultLogementDraft();
    }

    const parsed = JSON.parse(raw) as Partial<LogementDraft>;
    return { ...createDefaultLogementDraft(), ...parsed };
  } catch {
    return createDefaultLogementDraft();
  }
};

export const saveLogementDraft = (patch: Partial<LogementDraft>) => {
  if (typeof window === "undefined") {
    return;
  }

  const current = loadLogementDraft();
  const next = { ...current, ...patch };
  window.localStorage.setItem(LOGEMENT_DRAFT_STORAGE_KEY, JSON.stringify(next));
};

export const clearLogementDraft = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(LOGEMENT_DRAFT_STORAGE_KEY);
};
