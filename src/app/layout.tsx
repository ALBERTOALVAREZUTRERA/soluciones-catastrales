import type { Metadata } from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import FacebookPixel from '@/components/facebook-pixel';

const BASE_URL = 'https://www.solucionescatastrales.app';

export const metadata: Metadata = {
  title: 'Ingeniería Catastral y Topografía en Jaén | Soluciones Catastrales',
  description: 'Ingeniería Técnica en Jaén especializada en Levantamientos Topográficos, archivos GML, subsanación de discrepancias Catastro-Registro y revisiones de IBI en Andalucía.',
  keywords: ['Topógrafo Jaén', 'Archivo GML', 'Catastro', 'Registro de la Propiedad', 'Ingeniero Técnico', 'Andújar', 'Levantamiento Topográfico', 'Discrepancias Registrales', 'SOLUCIONES CATASTRALES'],
  metadataBase: new URL(BASE_URL),
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: 'Topografía e Ingeniería Catastral en Jaén | Soluciones Catastrales',
    description: 'Resolvemos discrepancias entre Catastro y Registro de la Propiedad en Andalucía mediante informes técnicos y cartografía GML.',
    url: BASE_URL,
    siteName: 'Soluciones Catastrales (Jaén)',
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Soluciones Catastrales y Registrales — Topografía e Ingeniería Catastral en Jaén',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ingeniería Catastral y Topografía en Jaén | Soluciones Catastrales',
    description: 'Resolvemos discrepancias Catastro-Registro. GML, topografía e IBI en Andalucía.',
    images: [`${BASE_URL}/og-image.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-SJB5J4ZTW7"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-SJB5J4ZTW7');
            `,
          }}
        />
        {/* LocalBusiness structured data — mejora la visibilidad en búsquedas locales */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "Soluciones Catastrales y Registrales",
              "description": "Ingeniería Técnica especializada en Levantamientos Topográficos, archivos GML, subsanación de discrepancias Catastro-Registro y revisiones de IBI en Jaén y Andalucía.",
              "url": "https://www.solucionescatastrales.app",
              "logo": "https://www.solucionescatastrales.app/og-image.png",
              "image": "https://www.solucionescatastrales.app/og-image.png",
              "telephone": "+34665890608",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Andújar",
                "addressRegion": "Jaén",
                "addressCountry": "ES"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 38.0392,
                "longitude": -4.0516
              },
              "areaServed": [
                { "@type": "State", "name": "Andalucía" },
                { "@type": "AdministrativeArea", "name": "Jaén" }
              ],
              "knowsAbout": [
                "Catastro Inmobiliario",
                "GML Catastral",
                "Topografía",
                "IBI",
                "Registro de la Propiedad",
                "Ingeniería Técnica",
                "Discrepancias Registrales"
              ],
              "priceRange": "$$",
              "sameAs": [
                "https://www.solucionescatastrales.app"
              ]
            })
          }}
        />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          {children}
          <FacebookPixel />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
