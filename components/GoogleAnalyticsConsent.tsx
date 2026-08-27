"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { useEffect, useState } from "react";

const GA_ID = "G-M2F8SWTL4B";
const CONSENT_STORAGE_KEY = "particulares-directo-cookie-consent";
const OPEN_SETTINGS_QUERY = "cookie-settings";

type ConsentChoice = "granted" | "denied" | null;

declare global {
  interface Window {
    dataLayer?: Object[];
    gtag?: (...args: unknown[]) => void;
  }
}

function prepareGoogleConsent() {
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    ((...args: unknown[]) => {
      window.dataLayer?.push(args);
    });

  window.gtag("consent", "default", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

function removeGoogleAnalyticsCookies() {
  const cookieNames = document.cookie
    .split(";")
    .map((cookie) => cookie.split("=")[0]?.trim())
    .filter((name): name is string => Boolean(name && name.startsWith("_ga")));

  const hostname = window.location.hostname;
  const hostnameParts = hostname.split(".");
  const rootDomain =
    hostnameParts.length > 1 ? `.${hostnameParts.slice(-2).join(".")}` : null;
  const domains = [hostname, `.${hostname}`, rootDomain].filter(
    (domain): domain is string => Boolean(domain),
  );

  for (const name of cookieNames) {
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;

    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/; domain=${domain}; SameSite=Lax`;
    }
  }
}

export default function GoogleAnalyticsConsent() {
  const [choice, setChoice] = useState<ConsentChoice>(null);
  const [ready, setReady] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    const savedChoice = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    const initialChoice: ConsentChoice =
      savedChoice === "granted" || savedChoice === "denied" ? savedChoice : null;

    const currentUrl = new URL(window.location.href);
    const openSavedSettings = currentUrl.searchParams.get(OPEN_SETTINGS_QUERY) === "1";

    if (openSavedSettings) {
      currentUrl.searchParams.delete(OPEN_SETTINGS_QUERY);
      window.history.replaceState({}, "", currentUrl);
    }

    if (initialChoice === "granted" && !openSavedSettings) {
      prepareGoogleConsent();
    }

    setAnalyticsEnabled(initialChoice === "granted");
    setChoice(initialChoice);
    setShowDetails(openSavedSettings);
    setShowSettings(initialChoice === null || openSavedSettings);
    setReady(true);
  }, []);

  function saveChoice(nextChoice: Exclude<ConsentChoice, null>) {
    const wasGranted = window.localStorage.getItem(CONSENT_STORAGE_KEY) === "granted";
    window.localStorage.setItem(CONSENT_STORAGE_KEY, nextChoice);

    if (nextChoice === "granted") {
      prepareGoogleConsent();
    } else if (wasGranted) {
      window.gtag?.("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
      removeGoogleAnalyticsCookies();
    }

    setChoice(nextChoice);
    setAnalyticsEnabled(nextChoice === "granted");
    setShowSettings(false);

    if (wasGranted && nextChoice === "denied") {
      window.location.reload();
    }
  }

  if (!ready) {
    return null;
  }

  return (
    <>
      {choice === "granted" ? <GoogleAnalytics gaId={GA_ID} /> : null}

      {showSettings ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-stone-950/30 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-consent-title"
        >
          <div className="w-full max-w-2xl rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl sm:p-6">
            <h2 id="cookie-consent-title" className="font-serif text-xl text-stone-900">
              Tu privacidad, tú decides
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              Usamos almacenamiento técnico para que la web funcione. Google Analytics es
              opcional y solo se activará si lo aceptas. Puedes cambiar tu decisión cuando quieras
              desde el pie de página.
            </p>

            {showDetails ? (
              <div className="mt-5 space-y-3">
                <div className="flex items-start justify-between gap-4 rounded-xl border border-stone-200 p-4">
                  <div>
                    <p className="font-medium text-stone-900">Necesarias</p>
                    <p className="mt-1 text-xs leading-relaxed text-stone-500">
                      Permiten iniciar sesión, mantener la seguridad y recordar tu elección.
                    </p>
                  </div>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600">
                    Siempre activas
                  </span>
                </div>

                <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-stone-200 p-4">
                  <span>
                    <span className="block font-medium text-stone-900">Analítica</span>
                    <span className="mt-1 block text-xs leading-relaxed text-stone-500">
                      Ayuda a entender el uso de la web mediante Google Analytics 4.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    className="mt-1 h-5 w-5 accent-fuchsia-700"
                    checked={analyticsEnabled}
                    onChange={(event) => setAnalyticsEnabled(event.target.checked)}
                  />
                </label>

                <p className="text-xs text-stone-500">
                  Consulta los detalles en el{" "}
                  <a href="/aviso-legal#cookies-analitica" className="underline hover:text-stone-900">
                    aviso de cookies y privacidad
                  </a>
                  .
                </p>
              </div>
            ) : null}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {!showDetails ? (
                <button
                  type="button"
                  onClick={() => setShowDetails(true)}
                  className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  Configurar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => saveChoice(analyticsEnabled ? "granted" : "denied")}
                  className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  Guardar preferencias
                </button>
              )}
              <button
                type="button"
                onClick={() => saveChoice("denied")}
                className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Rechazar
              </button>
              <button
                type="button"
                onClick={() => saveChoice("granted")}
                className="rounded-full bg-fuchsia-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-fuchsia-800"
              >
                Aceptar todas
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
