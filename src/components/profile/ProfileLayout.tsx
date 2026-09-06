import type { ReactNode } from 'react';

interface ProfileLayoutProps {
  header: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
}

export default function ProfileLayout({ header, sidebar, children }: ProfileLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-start text-[#434343]">
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[236px_minmax(0,1204px)] lg:gap-0 lg:px-0 lg:py-0">
        <main className="min-w-0 lg:order-2">
          {header}
          <div className="pt-4 lg:px-6 lg:pt-6">{children}</div>
        </main>
        <aside className="lg:order-1 lg:row-span-2">{sidebar}</aside>
      </div>
    </div>
  );
}
