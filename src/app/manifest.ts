import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';

// Minimal web app manifest: it carries the larger icons (192/512) that the
// <head> file conventions do not, and names the install target.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ScholarAI',
    short_name: 'ScholarAI',
    description:
      'Discover study funding opportunities around the world and keep your academic profile and documents in one place.',
    start_url: `/${routing.defaultLocale}`,
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#23c06d',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
