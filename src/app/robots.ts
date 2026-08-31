import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/superadmin/', '/account/', '/api/'],
    },
    sitemap: 'https://ujwalaeco.com/sitemap.xml',
  };
}
