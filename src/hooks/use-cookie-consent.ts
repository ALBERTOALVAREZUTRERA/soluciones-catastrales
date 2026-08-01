"use client";

import { useCallback, useEffect, useState } from "react";

export type CookieConsentValue = "accepted" | "rejected" | null;

const STORAGE_KEY = "soluciones-catastrales-cookie-consent";
const CONSENT_EVENT = "cookie-consent-updated";

function readStoredConsent(): CookieConsentValue {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "accepted" || stored === "rejected" ? stored : null;
}

function removeOptionalCookies() {
  if (typeof document === "undefined") return;
  const optionalCookiePrefixes = ["_ga", "_gid", "_gat", "_fbp", "_fbc"];
  const hostnameParts = window.location.hostname.split(".");
  const domains = [
    window.location.hostname,
    `.${window.location.hostname}`,
    hostnameParts.length > 1 ? `.${hostnameParts.slice(-2).join(".")}` : "",
  ].filter(Boolean);

  for (const cookie of document.cookie.split(";")) {
    const cookieName = cookie.split("=")[0]?.trim();
    if (!optionalCookiePrefixes.some((prefix) => cookieName.startsWith(prefix))) {
      continue;
    }

    document.cookie = `${cookieName}=; Max-Age=0; path=/; SameSite=Lax`;
    for (const domain of domains) {
      document.cookie = `${cookieName}=; Max-Age=0; path=/; domain=${domain}; SameSite=Lax`;
    }
  }
}

export function storeCookieConsent(value: Exclude<CookieConsentValue, null>) {
  window.localStorage.setItem(STORAGE_KEY, value);
  if (value === "rejected") removeOptionalCookies();
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
}

export function clearCookieConsent() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: null }));
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsentValue>(null);

  useEffect(() => {
    setConsent(readStoredConsent());

    const handleConsent = (event: Event) => {
      const detail = (event as CustomEvent<CookieConsentValue>).detail;
      setConsent(detail);
    };
    window.addEventListener(CONSENT_EVENT, handleConsent);
    return () => window.removeEventListener(CONSENT_EVENT, handleConsent);
  }, []);

  const updateConsent = useCallback(
    (value: Exclude<CookieConsentValue, null>) => storeCookieConsent(value),
    [],
  );
  const resetConsent = useCallback(() => clearCookieConsent(), []);

  return { consent, updateConsent, resetConsent };
}
