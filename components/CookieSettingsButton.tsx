"use client";

const OPEN_SETTINGS_STORAGE_KEY = "particulares-directo-open-cookie-settings";

export default function CookieSettingsButton() {
  function openSettings() {
    window.sessionStorage.setItem(OPEN_SETTINGS_STORAGE_KEY, "true");
    window.location.reload();
  }

  return (
    <button type="button" className="hover:text-stone-900" onClick={openSettings}>
      Configurar cookies
    </button>
  );
}
