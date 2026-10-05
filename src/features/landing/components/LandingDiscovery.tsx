'use client';

import { useState } from 'react';
import { Hero } from './Hero';
import { FeaturedScholarships } from './FeaturedScholarships';

export function LandingDiscovery() {
  const [query, setQuery] = useState('');
  function search(value: string) {
    setQuery(value);
    requestAnimationFrame(() => document.getElementById('scholarships')?.scrollIntoView());
  }
  return (
    <>
      <Hero onSearch={search} />
      <FeaturedScholarships query={query} />
    </>
  );
}
