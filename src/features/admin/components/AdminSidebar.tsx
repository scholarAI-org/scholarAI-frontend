'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { usePathname, Link } from '@/i18n/navigation';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { adminNavigation, isNavigationItemActive } from '../admin-navigation';

type AdminSidebarProps = { onNavigate?: () => void };

function initials(name: string) {
  return name.trim().slice(0, 1).toLocaleUpperCase() || '?';
}

export function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  const t = useTranslations('AdminShell');
  const pathname = usePathname();
  const { user } = useAuth();
  const { mutate: logout, isPending } = useLogout();
  const name = user?.name || user?.email || t('identity.unknown');

  return (
    <aside className="flex h-full min-h-0 w-[236px] flex-col border-e border-[#e2e8f0] bg-white">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-4">
        <div className="flex h-[104px] items-start justify-center pt-1">
          <Image
            src="/images/admin/brand.png"
            alt={t('brand.name')}
            width={65}
            height={79}
            className="h-[79px] w-[65px] object-contain"
            priority
          />
        </div>
        <div className="mx-auto flex h-[52px] w-[187px] shrink-0 items-center gap-[10px] rounded-full bg-[#f8fafc] px-3 text-start">
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#274383] text-[15px] font-extrabold text-white"
          >
            {initials(name)}
          </span>
          <span className="min-w-0">
            <bdi className="block truncate text-[12px] font-medium text-[#274383]">{name}</bdi>
            <span className="mt-[5px] block text-[10px] leading-none text-[#f97316]">
              {t('identity.role')}
            </span>
          </span>
        </div>
        <nav aria-label={t('navigationLabel')} className="mx-auto mt-6 w-[188px] space-y-6">
          {adminNavigation.map((group) => (
            <section key={group.id}>
              <h2 className="px-[13px] text-[10px] leading-none text-[#b5b5b5]">
                {t(group.labelKey)}
              </h2>
              <ul className="mt-2 space-y-1">
                {group.items.map((item) => {
                  const active = isNavigationItemActive(item, pathname);
                  const content = (
                    <>
                      <Image
                        src={item.icon}
                        alt=""
                        width={20}
                        height={20}
                        className="size-5 shrink-0"
                      />
                      <span className="min-w-0 flex-1 truncate">{t(item.labelKey)}</span>
                    </>
                  );
                  const className = `flex h-[38px] items-center gap-2 rounded-full px-4 text-sm transition-colors ${active ? 'bg-[#f8fafc] font-medium text-[#274383] ring-1 ring-inset ring-[#e2e8f0]' : 'text-[rgba(30,27,51,0.7)] hover:bg-[#f8fafc]'}`;
                  return (
                    <li key={item.id}>
                      {item.href ? (
                        <Link
                          href={item.href}
                          onClick={onNavigate}
                          aria-current={active ? 'page' : undefined}
                          className={className}
                        >
                          {content}
                        </Link>
                      ) : (
                        <span
                          aria-disabled="true"
                          title={t('unavailable')}
                          className={`${className} cursor-not-allowed opacity-60`}
                        >
                          {content}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </nav>
      </div>
      <div className="border-t border-[#e2e8f0] px-3 py-3">
        <button
          type="button"
          onClick={() => logout()}
          disabled={isPending}
          className="flex min-h-10 w-full items-center gap-2 rounded-full px-3 text-sm text-[rgba(30,27,51,0.7)] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Image
            src="/images/admin/logout.svg"
            alt=""
            width={20}
            height={20}
            className="size-5 shrink-0 rtl:rotate-180"
          />
          {isPending ? t('logoutPending') : t('logout')}
        </button>
      </div>
    </aside>
  );
}
