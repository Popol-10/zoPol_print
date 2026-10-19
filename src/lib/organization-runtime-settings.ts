import type { OrganizationSettings } from "@/lib/organizations";

const DEFAULT_CURRENCY = "MGA";
const DEFAULT_TIMEZONE = "Indian/Antananarivo";
const CACHE_PREFIX = "makart-organization-runtime-settings:";
const supportedCurrencies = new Set(["MGA", "EUR", "USD", "GBP"]);

let currentCurrency = DEFAULT_CURRENCY;
let currentTimeZone = DEFAULT_TIMEZONE;

function activate(
  settings: Pick<OrganizationSettings, "currency" | "timezone">,
) {
  currentCurrency = supportedCurrencies.has(settings.currency)
    ? settings.currency
    : DEFAULT_CURRENCY;
  try {
    new Intl.DateTimeFormat("fr-FR", { timeZone: settings.timezone }).format();
    currentTimeZone = settings.timezone;
  } catch {
    currentTimeZone = DEFAULT_TIMEZONE;
  }
}

export function setOrganizationRuntimeSettings(settings: OrganizationSettings) {
  activate(settings);
  try {
    window.localStorage.setItem(
      `${CACHE_PREFIX}${settings.id}`,
      JSON.stringify({
        currency: settings.currency,
        timezone: settings.timezone,
      }),
    );
  } catch {
    // Runtime settings remain active for the current page if storage is unavailable.
  }
}

export function restoreOrganizationRuntimeSettings(
  organizationId: string,
): boolean {
  try {
    const stored = window.localStorage.getItem(
      `${CACHE_PREFIX}${organizationId}`,
    );
    if (!stored) return false;
    const settings = JSON.parse(stored) as {
      currency?: string;
      timezone?: string;
    };
    activate({
      currency: settings.currency ?? DEFAULT_CURRENCY,
      timezone: settings.timezone ?? DEFAULT_TIMEZONE,
    });
    return true;
  } catch {
    return false;
  }
}

export function getOrganizationCurrency(): string {
  return currentCurrency;
}

export function getOrganizationTimeZone(): string {
  return currentTimeZone;
}
