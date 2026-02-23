import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://www.solucionescatastrales.app'
    const lastModified = new Date()

    // Base routes
    const routes = [
        '',
        '/servicios',
        '/herramientas/calculadora',
        '/herramientas/conversor-gml',
        '/herramientas/conversor-edificio',
        '/legal/aviso-legal',
        '/legal/privacidad',
        '/legal/cookies',
        '/legal/terminos',
    ]

    return routes.map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified,
        changeFrequency: 'monthly' as const,
        priority: route === '' ? 1 : 0.8,
    }))
}
