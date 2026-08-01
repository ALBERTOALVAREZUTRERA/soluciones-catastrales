import type { Metadata } from "next";

const DEFAULT_SITE_URL = "https://www.solucionescatastrales.app";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL
).replace(/\/+$/, "");

export const SITE_NAME = "Soluciones Catastrales y Registrales";
export const SOCIAL_IMAGE_PATH = "/og-social.jpg";

export function absoluteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString();
}

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  index?: boolean;
};

export function createPageMetadata({
  title,
  description,
  path,
  index = true,
}: PageMetadataOptions): Metadata {
  const canonical = absoluteUrl(path);
  const image = absoluteUrl(SOCIAL_IMAGE_PATH);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: {
      index,
      follow: true,
      googleBot: {
        index,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: "es_ES",
      type: "website",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — Topografía, GML e ingeniería catastral`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
