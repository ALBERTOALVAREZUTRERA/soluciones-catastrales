import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import FacebookPixel from '@/components/facebook-pixel';
import {
  AnalyticsScripts,
  CookieConsentBanner,
} from '@/components/cookie-consent';
import { JsonLd } from '@/components/json-ld';
import {
  absoluteUrl,
  createPageMetadata,
  SITE_NAME,
  SITE_URL,
} from '@/lib/site-config';

const inter = Inter({
  subsets: ['latin'],
  display: 'optional',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  ...createPageMetadata({
    title: 'Ingeniería Catastral y Topografía en Jaén',
    description: 'Levantamientos topográficos, planos georreferenciados, representación gráfica alternativa, GML, ICUC, subsanación de discrepancias catastrales, nota simple y proyectos de casetas y naves agrarias en Jaén y Andalucía.',
    path: '/',
  }),
  title: {
    default: 'Ingeniería Catastral y Topografía en Jaén | Soluciones Catastrales',
    template: '%s | Soluciones Catastrales',
  },
  keywords: ['Topógrafo Jaén', 'Levantamiento Topográfico', 'Plano Georreferenciado', 'Representación Gráfica Alternativa', 'ICUC', 'Subsanación de Discrepancias Catastrales', 'Nota Simple', 'Proyecto Nave Agrícola', 'Archivo GML', 'Catastro', 'Registro de la Propiedad', 'Ingeniero Técnico', 'Andújar', 'Levantamiento Topográfico', 'Discrepancias Registrales', 'SOLUCIONES CATASTRALES'],
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  category: 'Ingeniería y topografía',
  authors: [{ name: 'Alberto Álvarez Utrera', url: SITE_URL }],
  creator: 'Alberto Álvarez Utrera',
  publisher: SITE_NAME,
  // Código de Google Search Console (opcional).
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} scroll-smooth`}>
      <head>
        <link
          rel="preload"
          as="image"
          href="/servicios/hero_servicios.webp"
          media="(min-width: 768px)"
        />
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'ProfessionalService',
                '@id': `${SITE_URL}/#business`,
                name: SITE_NAME,
                description:
                  'Ingeniería técnica especializada en levantamientos topográficos, archivos GML, subsanación de discrepancias Catastro-Registro y revisiones de IBI en Jaén y Andalucía.',
                url: SITE_URL,
                image: absoluteUrl('/og-social.jpg'),
                telephone: '+34665890608',
                email: 'alberto.alvarez.utrera@gmail.com',
                address: {
                  '@type': 'PostalAddress',
                  streetAddress: 'Calle Nueva, 5',
                  addressLocality: 'Andújar',
                  addressRegion: 'Jaén',
                  addressCountry: 'ES',
                },
                areaServed: [
                  { '@type': 'AdministrativeArea', name: 'Jaén' },
                  { '@type': 'AdministrativeArea', name: 'Andalucía' },
                ],
                founder: {
                  '@type': 'Person',
                  name: 'Alberto Álvarez Utrera',
                  jobTitle: 'Ingeniero técnico',
                },
                hasOfferCatalog: {
                  '@type': 'OfferCatalog',
                  name: 'Servicios',
                  itemListElement: [
                    { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Levantamiento topográfico' } },
                    { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Plano georreferenciado' } },
                    { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Representación gráfica alternativa' } },
                    { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Archivo GML de parcela y de edificio' } },
                    { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Informe Catastral de Ubicación de las Construcciones (ICUC)' } },
                    { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Subsanación de discrepancias catastrales' } },
                    { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Nota simple del Registro de la Propiedad' } },
                    { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Proyectos de casetas y naves agrarias' } },
                  ],
                },
                knowsAbout: [
                  'Catastro inmobiliario',
                  'GML catastral',
                  'Topografía',
                  'Registro de la Propiedad',
                  'Discrepancias catastrales',
                ],
              },
              {
                '@type': 'WebSite',
                '@id': `${SITE_URL}/#website`,
                url: SITE_URL,
                name: SITE_NAME,
                inLanguage: 'es-ES',
                publisher: { '@id': `${SITE_URL}/#business` },
              },
            ],
          }}
        />
      </head>
      <body className="font-body antialiased">
        <a href="#contenido-principal" className="skip-link">
          Saltar al contenido principal
        </a>
        {children}
        <AnalyticsScripts />
        <FacebookPixel />
        <CookieConsentBanner />
      </body>
    </html>
  );
}
