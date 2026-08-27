"use client";

const OPEN_SETTINGS_QUERY = "cookie-settings";

export default function CookieSettingsButton() {
  function openSettings() {
    const url = new URL(window.location.href);
    url.searchParams.set(OPEN_SETTINGS_QUERY, "1");
    window.location.assign(url.toString());
  }

  return (
    <button type="button" className="hover:text-stone-900" onClick={openSettings}>
      Configurar cookies
    </button>
  );
}
