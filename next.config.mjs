
import type {NextConfig} from 'next';

// Correctly typed import for next-pwa
const withPWA = (await import('next-pwa')).default({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: false, // Ensure PWA is enabled in all environments
});


const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NODE_ENV === 'production' 
      ? 'https://your-production-url.com' // TODO: Replace with your production URL
      : 'http://localhost:3000',
  },
};

export default withPWA(nextConfig);

