"use client";

const OPEN_SETTINGS_EVENT = "particulares-directo:open-cookie-settings";

export default function CookieSettingsButton() {
  return (
    <button
      type="button"
      className="hover:text-stone-900"
      onClick={() => window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT))}
    >
      Configurar cookies
    </button>
  );
}
