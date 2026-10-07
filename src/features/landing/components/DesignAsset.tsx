/* Figma SVGs retain their intrinsic dimensions, including their stroke bounds. */
/* eslint-disable @next/next/no-img-element */
import { landingAssets } from '../assets';

export function DesignAsset({
  name,
  className,
  alt = '',
}: {
  name: keyof typeof landingAssets;
  className?: string;
  alt?: string;
}) {
  return <img src={landingAssets[name]} alt={alt} className={className} />;
}
