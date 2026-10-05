import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/shared/Container';
import { LandingLogo } from './LandingLogo';
import { DesignAsset } from './DesignAsset';

const DESTINATIONS = [
  ['#scholarships', '#matching', '#scholarships'],
  ['#documents', '/student/profile', '/student/profile'],
  ['#about', '/admin/dashboard', '/register'],
] as const;
export function Footer() {
  const t = useTranslations('Landing.updated.footer');
  const columns = t.raw('columns') as { title: string; links: string[] }[];
  return (
    <footer className="landing-footer">
      <Container>
        <div className="footer-columns">
          <div className="footer-brand">
            <LandingLogo />
            <p>{t('description')}</p>
          </div>
          {columns.map((column, i) => (
            <div key={column.title}>
              <h3>{column.title}</h3>
              {column.links.map((label, j) =>
                i === 1 && j === 2 ? (
                  <span key={label} aria-disabled="true">
                    {label}
                  </span>
                ) : (
                  <Link key={label} href={DESTINATIONS[i][j]}>
                    {label}
                  </Link>
                )
              )}
            </div>
          ))}
        </div>
        <div className="footer-rule">
          <DesignAsset name="2075-770-imgFooterLine" />
        </div>
        <div className="footer-bottom">
          <p>{t('copyright')}</p>
          <div className="footer-social">
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              <DesignAsset name="2075-770-imgLinkedin" />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <DesignAsset name="2075-770-imgGithub" />
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
