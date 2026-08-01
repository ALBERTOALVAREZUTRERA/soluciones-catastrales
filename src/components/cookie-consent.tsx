"use client";

import Link from "next/link";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { useCookieConsent } from "@/hooks/use-cookie-consent";

const GA_ID = "G-SJB5J4ZTW7";

export function AnalyticsScripts() {
  const { consent } = useCookieConsent();
  if (consent !== "accepted") return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}

export function CookieConsentBanner() {
  const { consent, updateConsent, resetConsent } = useCookieConsent();

  if (consent) {
    return (
      <button
        type="button"
        onClick={resetConsent}
        className="fixed bottom-3 left-3 z-[100] rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-lg hover:bg-slate-50"
        aria-label="Cambiar configuración de cookies"
      >
        Cookies
      </button>
    );
  }

  return (
    <aside
      className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl md:p-6"
      aria-label="Configuración de cookies"
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <h2 className="mb-2 text-lg font-bold text-primary">
            Privacidad y cookies
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Utilizamos cookies técnicas necesarias y, solo si lo autoriza,
            cookies de medición de Google Analytics y Meta. Puede cambiar su
            decisión en cualquier momento.{" "}
            <Link
              href="/legal/cookies"
              className="font-semibold text-primary underline underline-offset-2"
            >
              Más información
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => updateConsent("rejected")}
          >
            Rechazar opcionales
          </Button>
          <Button
            type="button"
            className="bg-accent text-white hover:bg-accent/90"
            onClick={() => updateConsent("accepted")}
          >
            Aceptar analítica
          </Button>
        </div>
      </div>
    </aside>
  );
}
