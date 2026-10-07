import type { landingAssets } from '../assets';
import { DesignAsset } from './DesignAsset';

export function FeatureCard({
  title,
  description,
  icon,
  tone,
  index,
}: {
  title: string;
  description: string;
  icon: keyof typeof landingAssets;
  tone: string;
  index: number;
}) {
  return (
    <article className="landing-feature-card" data-landing-reveal={index % 3}>
      <div className="feature-icon" style={{ backgroundColor: tone }}>
        <DesignAsset name={icon} />
      </div>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </article>
  );
}
