import type { Metadata } from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import FacebookPixel from '@/components/facebook-pixel';

export const metadata: Metadata = {
  title: 'Ingeniería Catastral y Topografía en Jaén | Soluciones Catastrales',
  description: 'Ingeniería Técnica en Jaén especializada en Levantamientos Topográficos, archivos GML, subsanación de discrepancias Catastro-Registro y revisiones de IBI en Andalucía.',
  keywords: ['Topógrafo Jaén', 'Archivo GML', 'Catastro', 'Registro de la Propiedad', 'Ingeniero Técnico', 'Andújar', 'Levantamiento Topográfico', 'Discrepancias Registrales', 'SOLUCIONES CATASTRALES'],
  metadataBase: new URL('https://solucionescatastrales.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Topografía e Ingeniería Catastral en Jaén | Soluciones Catastrales',
    description: 'Resolvemos discrepancias entre Catastro y Registro de la Propiedad en Andalucía mediante informes técnicos y cartografía GML.',
    url: 'https://solucionescatastrales.app',
    siteName: 'Soluciones Catastrales (Jaén)',
    locale: 'es_ES',
    type: 'website',
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
