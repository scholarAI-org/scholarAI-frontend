import type { DiscoveryRouter } from './discovery-navigator';

interface HistoryWindow {
  history: Pick<History, 'pushState' | 'replaceState'>;
  location: Pick<Location, 'pathname' | 'search'>;
}

// Discovery only changes the query string of the current page, so it updates the
// URL with the native History API. Next.js App Router integrates pushState and
// replaceState (useSearchParams stays in sync, Back/Forward work) without the
// router.push RSC round-trip, so the controls update immediately.
// A navigation to the URL already shown is skipped, so a second click that lands
// before React re-renders cannot add a duplicate history entry.
export function createHistoryRouter(
  getWindow: () => HistoryWindow = () => window
): DiscoveryRouter {
  const navigate = (method: 'pushState' | 'replaceState', href: string) => {
    const { history, location } = getWindow();
    if (href !== `${location.pathname}${location.search}`) history[method](null, '', href);
  };
  return {
    push: (href) => navigate('pushState', href),
    replace: (href) => navigate('replaceState', href),
  };
}
