import { LogOut } from 'lucide-react';
import Image from 'next/image';
import type { ProfileUser, SidebarMenuItem } from './types';

interface SidebarProps {
  brand: {
    name: string;
    tagline: string;
    logoSrc: string;
  };
  user: ProfileUser;
  items: SidebarMenuItem[];
  logoutLabel: string;
}

function SidebarUserCard({ user }: { user: ProfileUser }) {
  return (
    <div className="flex h-[65px] w-[187px] items-center justify-start gap-3 rounded-2xl bg-[#f8fafc] px-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#274383] text-[15px] font-extrabold text-white">
        {user.initials}
      </span>
      <div className="min-w-0 text-start">
        <p className="truncate text-[15px] font-medium leading-[1.25] text-[#274383]">
          <bdi>{user.name}</bdi>
        </p>
        {user.role && (
          <p className="mt-2 flex items-center justify-start gap-1 text-[10px] leading-none text-[#f97316]">
            {user.roleIcon}
            <span className="truncate">{user.role}</span>
          </p>
        )}
      </div>
    </div>
  );
}

function SidebarItem({ item }: { item: SidebarMenuItem }) {
  const Icon = item.icon;

  return (
    <a
      href={item.href ?? '#'}
      className={[
        'flex items-center justify-start rounded-full px-4 text-sm transition-colors gap-4 ',
        item.active
          ? 'h-[42px] border border-[#f97316] bg-[#f8fafc] font-bold text-[#f97316]'
          : 'h-[38px] text-[rgba(30,27,51,0.7)] hover:bg-[#f8fafc]',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="flex items-center gap-2">
        <span>{item.label}</span>
        {item.badge && (
          <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#f97316] px-1 text-[10px] font-black text-white">
            {item.badge}
          </span>
        )}
      </span>
    </a>
  );
}

export default function Sidebar({ brand, user, items, logoutLabel }: SidebarProps) {
  return (
    <nav className="rounded-3xl border border-[#e2e8f0] bg-white px-5 py-6 lg:min-h-[733px] lg:rounded-none lg:border-y-0 lg:border-e">
      <div className="mx-auto max-w-[196px]">
        <div className="flex h-[108px] items-start justify-start gap-2 pt-2">
          <Image
            src={brand.logoSrc}
            alt={brand.name}
            width={50}
            height={42}
            className="h-[42px] w-[50px] shrink-0 rounded-full object-cover"
            priority
          />
          <div className="text-start">
            <p className="text-[17px] font-bold leading-[1.5] text-[#274383]">
              <bdi>{brand.name}</bdi>
            </p>
            <p className="text-[10px] leading-[1.2] text-[#f97316]">{brand.tagline}</p>
          </div>
        </div>

        <div>
          <SidebarUserCard user={user} />
        </div>

        <div className="mt-6 w-[188px] space-y-2">
          {items.map((item) => (
            <SidebarItem key={item.id} item={item} />
          ))}
        </div>
      </div>

      <div className="mt-10 border-t border-[#f1f5f9] pt-5">
        <button
          type="button"
          className="mx-auto flex h-[42px] w-full max-w-[196px] items-center justify-center gap-2 rounded-full px-3 text-sm text-[#b5b5b5] transition-colors hover:bg-[#f8fafc]"
        >
          <span>{logoutLabel}</span>
          <LogOut className="h-5 w-5 rtl:rotate-180" />
        </button>
      </div>
    </nav>
  );
}
