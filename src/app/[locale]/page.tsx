import { Navbar } from '@/features/landing/components/Navbar';
import { Hero } from '@/features/landing/components/Hero';
import { StatsRow } from '@/features/landing/components/StatsRow';
import { FeaturedScholarships } from '@/features/landing/components/FeaturedScholarships';
import { HowItWorks } from '@/features/landing/components/HowItWorks';
import { AiFeatures } from '@/features/landing/components/AiFeatures';
import { Testimonials } from '@/features/landing/components/Testimonials';
import { ContactSection } from '@/features/landing/components/ContactSection';
import { CtaBand } from '@/features/landing/components/CtaBand';
import { Footer } from '@/features/landing/components/Footer';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <StatsRow />
        <FeaturedScholarships />
        <HowItWorks />
        <AiFeatures />
        <Testimonials />
        <ContactSection />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}
