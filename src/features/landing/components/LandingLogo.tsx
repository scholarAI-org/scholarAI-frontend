import { Link } from '@/i18n/navigation';
import { DesignAsset } from './DesignAsset';

export function LandingLogo() {
  return (
    <Link href="/" className="landing-logo" aria-label="PsScholar">
      <DesignAsset name="2104-2444-imgPhoto202609151629301" />
    </Link>
  );
}
