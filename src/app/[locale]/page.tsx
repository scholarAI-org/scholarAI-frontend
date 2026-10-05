import { Rubik, Cairo } from 'next/font/google';
import { Navbar } from '@/features/landing/components/Navbar';
import { LandingDiscovery } from '@/features/landing/components/LandingDiscovery';
import { PlatformOverview } from '@/features/landing/components/PlatformOverview';
import { HowItWorks } from '@/features/landing/components/HowItWorks';
import { AiFeatures } from '@/features/landing/components/AiFeatures';
import { FeatureSpotlight } from '@/features/landing/components/FeatureSpotlight';
import { Faq } from '@/features/landing/components/Faq';
import { ContactSection } from '@/features/landing/components/ContactSection';
import { CtaBand } from '@/features/landing/components/CtaBand';
import { Footer } from '@/features/landing/components/Footer';
import { LandingMotion } from '@/features/landing/components/LandingMotion';
import '@/features/landing/landing.css';

const rubik = Rubik({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700'],
  variable: '--font-landing-rubik',
  display: 'swap',
});
const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['500', '700', '900'],
  variable: '--font-landing-cairo',
  display: 'swap',
});

export default function LandingPage() {
  return (
    <LandingMotion className={`landing-page ${rubik.variable} ${cairo.variable}`}>
      <Navbar />
      <main>
        <LandingDiscovery />
        <PlatformOverview />
        <AiFeatures />
        <HowItWorks />
        <FeatureSpotlight kind="matching" />
        <FeatureSpotlight kind="documents" />
        <Faq />
        <CtaBand />
        <ContactSection />
      </main>
      <Footer />
    </LandingMotion>
  );
}
