import type { Metadata } from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export const metadata: Metadata = {
  title: 'SOLUCIONES CATASTRALES | Alberto Álvarez',
  description: 'Ingeniería Técnica especializada en archivos GML, coordinación Catastro-Registro y revisiones de IBI. Soluciones profesionales en Jaén.',
  keywords: ['GML', 'Catastro', 'Registro de la Propiedad', 'Ingeniero Técnico', 'Jaén', 'Andújar', 'IBI', 'Topografía', 'SOLUCIONES CATASTRALES'],
  metadataBase: new URL('https://solucionescatastrales.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'SOLUCIONES CATASTRALES | Alberto Álvarez',
    description: 'Ingeniería Técnica y archivos GML en Jaén.',
    url: 'https://solucionescatastrales.app',
    siteName: 'Soluciones Catastrales',
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
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
