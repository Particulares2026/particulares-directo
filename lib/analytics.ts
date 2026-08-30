type AnalyticsValue = string | number | boolean;

export function trackGoogleAnalyticsEvent(
  eventName: string,
  parameters: Record<string, AnalyticsValue> = {},
) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", eventName, parameters);
}
