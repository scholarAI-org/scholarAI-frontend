'use client';

import { useRouter } from '@/i18n/navigation';
import { Hero } from './Hero';

export function LandingDiscovery() {
  const router = useRouter();
  function search(value: string) {
    const query = value.trim();
    router.push(
      query ? `/student/scholarships?search=${encodeURIComponent(query)}` : '/student/scholarships'
    );
  }
  return <Hero onSearch={search} />;
}
