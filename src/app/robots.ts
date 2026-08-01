import { MetadataRoute } from 'next'
import { absoluteUrl, SITE_URL } from '@/lib/site-config'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: '/api/',
            },
        ],
        sitemap: absoluteUrl('/sitemap.xml'),
        host: SITE_URL,
    }
}
