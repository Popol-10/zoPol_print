import { apiRequest, withBearer } from "@/lib/api";

export interface OrganizationSettings {
  id: string;
  name: string;
  address: string | null;
  currency: string;
  timezone: string;
}

export interface UpdateOrganizationSettingsInput {
  name: string;
  address: string | null;
  currency: string;
  timezone: string;
}

export const organizationCurrencies = [
  { value: "MGA", label: "Ariary malgache (MGA)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "USD", label: "Dollar américain (USD)" },
  { value: "GBP", label: "Livre sterling (GBP)" },
] as const;

export const organizationTimeZones = [
  { value: "Indian/Antananarivo", label: "Antananarivo (UTC+3)" },
  { value: "Africa/Nairobi", label: "Nairobi (UTC+3)" },
  { value: "Africa/Johannesburg", label: "Johannesburg (UTC+2)" },
  { value: "Europe/Paris", label: "Paris" },
  { value: "Europe/London", label: "Londres" },
  { value: "America/New_York", label: "New York" },
  { value: "America/Los_Angeles", label: "Los Angeles" },
  { value: "Asia/Dubai", label: "Dubaï (UTC+4)" },
  { value: "Asia/Kolkata", label: "Kolkata (UTC+5:30)" },
  { value: "Asia/Tokyo", label: "Tokyo (UTC+9)" },
] as const;

export const organizationsApi = {
  getSettings: (accessToken: string) =>
    apiRequest<OrganizationSettings>("/organizations/me/settings", {
      headers: withBearer(accessToken),
    }),
  updateSettings: (
    accessToken: string,
    input: UpdateOrganizationSettingsInput,
  ) =>
    apiRequest<OrganizationSettings>("/organizations/me/settings", {
      method: "PUT",
      body: JSON.stringify(input),
      headers: withBearer(accessToken),
    }),
};
