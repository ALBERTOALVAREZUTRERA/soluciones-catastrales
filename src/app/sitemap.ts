import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://www.solucionescatastrales.app'
    const lastModified = new Date()

    const pages = [
        // Página principal
        { path: '',                                     priority: 1.0,  changeFreq: 'weekly'  },
        // Servicios y trámites
        { path: '/servicios',                           priority: 0.9,  changeFreq: 'monthly' },
        { path: '/tramites-registrales',                priority: 0.9,  changeFreq: 'monthly' },
        { path: '/tramites-catastrales',                priority: 0.9,  changeFreq: 'monthly' },
        // Herramientas (alto valor SEO — tráfico orgánico)
        { path: '/herramientas/calculadora',            priority: 0.9,  changeFreq: 'monthly' },
        { path: '/herramientas/calculadora-rustica',    priority: 0.9,  changeFreq: 'monthly' },
        { path: '/herramientas/conversor-gml',          priority: 0.85, changeFreq: 'monthly' },
        { path: '/herramientas/conversor-edificio',     priority: 0.85, changeFreq: 'monthly' },
        { path: '/herramientas/visor-catastral',        priority: 0.8,  changeFreq: 'monthly' },
        // Legales (baja prioridad)
        { path: '/legal/aviso-legal',                   priority: 0.3,  changeFreq: 'yearly'  },
        { path: '/legal/privacidad',                    priority: 0.3,  changeFreq: 'yearly'  },
        { path: '/legal/cookies',                       priority: 0.3,  changeFreq: 'yearly'  },
        { path: '/legal/terminos',                      priority: 0.3,  changeFreq: 'yearly'  },
    ]

    return pages.map(({ path, priority, changeFreq }) => ({
        url: `${baseUrl}${path}`,
        lastModified,
        changeFrequency: changeFreq as MetadataRoute.Sitemap[0]['changeFrequency'],
        priority,
    }))
}
