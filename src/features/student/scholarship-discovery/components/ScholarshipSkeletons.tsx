import type { DiscoveryView } from '../types';

const SKELETON_COUNT = 4;
const block = 'animate-pulse rounded-full bg-[#eef2f6]';

// Mirrors the card layouts so the first load does not shift. Decorative only; the
// results area announces the loading status separately.
export function ScholarshipSkeletons({ view }: { view: DiscoveryView }) {
  return (
    <ul
      aria-hidden
      className={view === 'grid' ? 'grid gap-6 md:grid-cols-2' : 'flex flex-col gap-4'}
    >
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <li
          key={index}
          className={`flex overflow-hidden rounded-2xl border border-gray-300 bg-white ${view === 'grid' ? 'flex-col' : 'flex-col sm:flex-row'}`}
        >
          <div
            className={`animate-pulse bg-[#eef2f6] ${view === 'grid' ? 'aspect-[448/184] w-full' : 'aspect-[448/184] w-full sm:aspect-[4/3] sm:w-44'}`}
          />
          <div className="flex flex-1 flex-col gap-3 p-4">
            <div className={`${block} h-6 w-20`} />
            <div className={`${block} h-4 w-3/4`} />
            <div className={`${block} h-3 w-1/3`} />
            <div className={`${block} h-3 w-1/4`} />
            <div className="mt-2 flex items-center gap-4 border-t border-gray-300 pt-4">
              <div className={`${block} h-3 flex-1`} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
