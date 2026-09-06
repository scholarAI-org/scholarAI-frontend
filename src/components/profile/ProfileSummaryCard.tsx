import { Camera, LoaderCircle } from 'lucide-react';
import { useRef } from 'react';
import { AVATAR_ACCEPT } from '@/features/profile/schemas/avatar.schema';
import type { ProfileCompletion, ProfileUser } from './types';
import { ProfileCompletionRing } from './ProfileCompletionRing';

interface ProfileSummaryCardProps {
  user: ProfileUser;
  completion: ProfileCompletion;
  avatarActionLabel?: string;
  onChangeAvatar?: (file: File) => void | Promise<void>;
  isAvatarUploading?: boolean;
  avatarError?: string | null;
}

export default function ProfileSummaryCard({
  user,
  completion,
  avatarActionLabel = 'تغيير الصورة',
  onChangeAvatar,
  isAvatarUploading = false,
  avatarError,
}: ProfileSummaryCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function selectAvatar() {
    if (!isAvatarUploading) fileInputRef.current?.click();
  }

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file && !isAvatarUploading && onChangeAvatar) {
      void Promise.resolve(onChangeAvatar(file)).catch(() => undefined);
    }
  }

  return (
    <section
      dir="rtl"
      className="relative flex min-h-[176px] flex-col items-center gap-6 rounded-3xl border border-[var(--color-primary)] bg-white px-5 py-4 sm:px-8 lg:flex-row lg:justify-between lg:px-10"
    >
      <div className="flex min-w-0 flex-col items-center gap-4 text-center sm:flex-row sm:text-start lg:max-w-[75%]">
        <div className="relative flex size-28 shrink-0 items-center justify-center overflow-visible rounded-full bg-[#274383] text-4xl font-bold text-white">
          {user.avatarUrl ? (
            // A native image keeps arbitrary backend/CDN URLs usable without leaking or rewriting them.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={`الصورة الشخصية لـ ${user.name}`}
              className="size-full rounded-full object-cover"
            />
          ) : (
            <span aria-hidden="true">{user.initials}</span>
          )}
          {isAvatarUploading && (
            <span
              className="absolute inset-0 flex items-center justify-center rounded-full bg-[#274383]/70 text-white"
              aria-label="جاري رفع الصورة"
            >
              <LoaderCircle className="size-7 animate-spin" aria-hidden="true" />
            </span>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={AVATAR_ACCEPT}
            onChange={handleAvatarChange}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />
          <button
            type="button"
            aria-label={avatarActionLabel}
            onClick={selectAvatar}
            disabled={isAvatarUploading}
            className="absolute bottom-0 end-0 flex size-9 items-center justify-center rounded-full bg-[var(--color-primary)] text-white ring-4 ring-white transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
          >
            <Camera className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div className="min-w-0">
          <h2 className="break-words text-xl font-bold leading-tight text-[#274383] sm:text-2xl">
            <bdi>{user.name}</bdi>
          </h2>
          {user.headline && (
            <p className="mt-2 break-words text-sm leading-6 text-[var(--color-text-label)] sm:text-base">
              <bdi>{user.headline}</bdi>
            </p>
          )}
        </div>
      </div>

      {avatarError && (
        <p
          className="text-center text-sm text-[var(--color-text-error)] lg:absolute lg:bottom-2 lg:start-10"
          role="alert"
        >
          {avatarError}
        </p>
      )}

      <ProfileCompletionRing percentage={completion.value} label={completion.label} />
    </section>
  );
}
