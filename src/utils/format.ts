import { getOrganizationCurrency } from "@/lib/organization-runtime-settings";

export const formatCurrency = (value: number) => {
  const currency = getOrganizationCurrency();
  if (currency === "MGA") {
    return `${new Intl.NumberFormat("fr-FR").format(value)} Ar`;
  }
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatAr = formatCurrency;

export const currencyUnitLabel = () =>
  getOrganizationCurrency() === "MGA" ? "Ar" : getOrganizationCurrency();

export const shortAr = (value: number) => {
  const currency = getOrganizationCurrency();
  if (currency === "MGA") {
    return `${(value / 1000000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M`;
  }
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
};

export const formatPercent = (value: number) =>
  `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
