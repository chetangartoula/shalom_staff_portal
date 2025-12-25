import type {NextConfig} from 'next';

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

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
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'mercury.shalomtrek.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  // env: {
  //   NEXT_PUBLIC_APP_URL: 'https://shalom-staff-portal.vercel.app',
  // },

  compiler: {
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },
  experimental: {
    // Optimize server builds
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@radix-ui/react-*'
    ]
  }
};

export default withBundleAnalyzer(nextConfig);