import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Shalom Staff Portal',
    short_name: 'Staff Portal',
    description: 'Portal for managing trekking operations, assignments, travelers, porters, guides, and payments.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#151d4f',
    icons: [
      {
        src: '/logo/pwa.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo/pwa.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}