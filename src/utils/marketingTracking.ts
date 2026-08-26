export type MarketingEventName =
  | "marketing_attribution_captured"
  | "trial_cta_click"
  | "demo_cta_click";

type MarketingAttribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  landing_path?: string;
  captured_at: string;
};

type MarketingEventPayload = Record<string, string | number | boolean | undefined>;

type MarketingWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>;
};

const ATTRIBUTION_STORAGE_KEY = "mtdrb_marketing_attribution";

const readStoredAttribution = (): MarketingAttribution | undefined => {
  if (typeof window === "undefined") return undefined;

  try {
    const stored = window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!stored) return undefined;
    return JSON.parse(stored) as MarketingAttribution;
  } catch {
    return undefined;
  }
};

export const captureMarketingAttribution = (
  search = typeof window === "undefined" ? "" : window.location.search,
): MarketingAttribution | undefined => {
  if (typeof window === "undefined") return undefined;

  const params = new URLSearchParams(search);
  const values: Omit<MarketingAttribution, "captured_at"> = {
    utm_source: params.get("utm_source") || undefined,
    utm_medium: params.get("utm_medium") || undefined,
    utm_campaign: params.get("utm_campaign") || undefined,
    utm_content: params.get("utm_content") || undefined,
    utm_term: params.get("utm_term") || undefined,
    landing_path: window.location.pathname,
  };

  const hasUtmParameters = [
    values.utm_source,
    values.utm_medium,
    values.utm_campaign,
    values.utm_content,
    values.utm_term,
  ].some(Boolean);
  if (!hasUtmParameters) return readStoredAttribution();

  const attribution: MarketingAttribution = {
    ...values,
    captured_at: new Date().toISOString(),
  };

  try {
    window.sessionStorage.setItem(
      ATTRIBUTION_STORAGE_KEY,
      JSON.stringify(attribution),
    );
  } catch {
    // Attribution is helpful but must never block the application.
  }

  trackMarketingEvent("marketing_attribution_captured", attribution);
  return attribution;
};

export const getMarketingAttribution = (): MarketingAttribution | undefined =>
  readStoredAttribution();

export const trackMarketingEvent = (
  name: MarketingEventName,
  payload: MarketingEventPayload = {},
): void => {
  if (typeof window === "undefined") return;

  const event = {
    event: `mtdrb_${name}`,
    ...payload,
    attribution: getMarketingAttribution(),
    occurred_at: new Date().toISOString(),
  };

  const marketingWindow = window as MarketingWindow;
  marketingWindow.dataLayer = marketingWindow.dataLayer || [];
  marketingWindow.dataLayer.push(event);

  if (import.meta.env.DEV) {
    console.info("[marketing]", event);
  }
};
