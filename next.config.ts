
import type { NextConfig } from 'next';

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: false, // Enable PWA in development for testing
  register: true,
  skipWaiting: true,
  runtimeCaching: require('next-pwa/cache'), // Use default runtime caching strategies
});

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https' as const,
        hostname: 'noympgnaetcrtpdlkkry.supabase.co', // Added Supabase hostname
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

const config = process.env.NODE_ENV === 'production' ? withPWA(nextConfig) : nextConfig;

export default config;
