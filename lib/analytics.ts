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

export function setGoogleAnalyticsUserProperties(
  properties: Record<string, AnalyticsValue>,
) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("set", "user_properties", properties);
}
