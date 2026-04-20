/**
 * Componente reutilizable para inyectar JSON-LD (Schema.org) en cualquier página.
 * Uso: <JsonLd data={{ "@context": "https://schema.org", "@type": "...", ... }} />
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
