import type { Metadata } from 'next';
import { Navbar } from '@/features/landing/components/Navbar';
import { Hero } from '@/features/landing/components/Hero';
import { StatsRow } from '@/features/landing/components/StatsRow';
import { HowItWorks } from '@/features/landing/components/HowItWorks';
import { ContactSection } from '@/features/landing/components/ContactSection';
import { CtaBand } from '@/features/landing/components/CtaBand';
import { Footer } from '@/features/landing/components/Footer';
import { PlatformFeatures } from '@/features/landing/components/PlatformFeatures';
import { Faq } from '@/features/landing/components/Faq';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isArabic = locale === 'ar';

  return {
    title: isArabic
      ? 'PsScholar | منصة الفرص الأكاديمية'
      : 'PsScholar | Academic opportunities platform',
    description: isArabic
      ? 'نظّم ملفك الأكاديمي ووثائقك وتفضيلاتك الدراسية مع PsScholar.'
      : 'Organize your academic profile, documents, and study preferences with PsScholar.',
  };
}

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <StatsRow />
        <PlatformFeatures />
        <HowItWorks />
        <Faq />
        <ContactSection />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}
