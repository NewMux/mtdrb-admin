const readEnv = (key: string): string | undefined => {
  const value = import.meta.env[key] as string | undefined;
  const trimmed = value?.trim();
  return trimmed || undefined;
};

const readNumber = (key: string, fallback: number): number => {
  const raw = readEnv(key);
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const DEFAULT_APP_NAME = readEnv("VITE_APP_NAME") || "MTDRB Fitness";
export const DEFAULT_LANGUAGE = readEnv("VITE_DEFAULT_LANGUAGE") || "English";
export const DEFAULT_TIMEZONE =
  readEnv("VITE_DEFAULT_TIMEZONE") ||
  (typeof Intl !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
    : "UTC");
export const DEFAULT_CURRENCY = readEnv("VITE_DEFAULT_CURRENCY") || "";
export const DEFAULT_COUNTRY_CODE = readEnv("VITE_DEFAULT_COUNTRY_CODE") || "";
export const DEFAULT_VAT_RATE = readNumber("VITE_DEFAULT_VAT_RATE", 0);
export const PLATFORM_CURRENCY =
  readEnv("VITE_PLATFORM_CURRENCY") || DEFAULT_CURRENCY || "USD";

export type SubscriptionPlan = {
  id: "starter" | "pro";
  name: string;
  price: number;
  period: "month" | "year";
  currency: string;
  description: string;
  features: string[];
  popular: boolean;
  color: "blue" | "purple";
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "starter",
    name: readEnv("VITE_STARTER_PLAN_NAME") || "Starter",
    price: readNumber("VITE_STARTER_PRICE", 80),
    period: "month",
    currency: PLATFORM_CURRENCY,
    description: "Perfect for single-location gyms",
    features: [
      "All core features",
      "Single location",
      `+${readNumber("VITE_STARTER_EXTRA_LOCATION_PRICE", 20)} ${PLATFORM_CURRENCY}/month per extra location`,
      "Basic analytics",
      "Email support",
    ],
    popular: false,
    color: "blue",
  },
  {
    id: "pro",
    name: readEnv("VITE_PRO_PLAN_NAME") || "Pro",
    price: readNumber("VITE_PRO_PRICE", 130),
    period: "month",
    currency: PLATFORM_CURRENCY,
    description: "Everything in Starter & scale your gym",
    features: [
      "Everything in Starter",
      `${readNumber("VITE_PRO_EXTRA_LOCATION_PRICE", 10)} ${PLATFORM_CURRENCY}/month per extra location`,
      "Unlimited members",
      "Advanced analytics",
      "Priority support",
      "WhatsApp bot",
    ],
    popular: true,
    color: "purple",
  },
];

export const currencyLabel = (currency?: string): string => {
  const normalized = currency?.trim().toUpperCase();
  return normalized || "";
};
