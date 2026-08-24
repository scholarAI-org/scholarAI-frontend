'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { Container } from '@/components/shared/Container';
import { Reveal } from '@/components/shared/Reveal';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { buttonStyles } from '@/components/ui/Button';
import { MailIcon, UserIcon } from '@/components/icons';

export function ContactSection() {
  const t = useTranslations('Landing.contact');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <section id="contact" className="overflow-hidden bg-[var(--color-bg-page)]">
      <Container className="grid grid-cols-1 items-center gap-12 py-16 sm:py-20 lg:grid-cols-2">
        <Reveal className="order-2 flex flex-col gap-5 lg:order-1">
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-bold text-[var(--color-navy-900)]">{t('heading')}</h2>
            <p className="text-[15px] leading-relaxed text-[var(--color-gray-500)]">
              {t('subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="contact-name" className="text-[var(--color-navy-800)]">
                {t('nameLabel')}
              </Label>
              <Input
                id="contact-name"
                name="name"
                required
                placeholder={t('namePlaceholder')}
                icon={<UserIcon className="h-[18px] w-[18px]" />}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="contact-email" className="text-[var(--color-navy-800)]">
                {t('emailLabel')}
              </Label>
              <Input
                id="contact-email"
                name="email"
                type="email"
                required
                placeholder={t('emailPlaceholder')}
                icon={<MailIcon className="h-[18px] w-[18px]" />}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="contact-subject" className="text-[var(--color-navy-800)]">
                {t('subjectLabel')}
              </Label>
              <Input
                id="contact-subject"
                name="subject"
                required
                placeholder={t('subjectPlaceholder')}
                icon={<MailIcon className="h-[18px] w-[18px]" />}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="contact-message" className="text-[var(--color-navy-800)]">
                {t('messageLabel')}
              </Label>
              <textarea
                id="contact-message"
                name="message"
                required
                rows={4}
                placeholder={t('messagePlaceholder')}
                className="w-full resize-none rounded-[var(--radius-input)] border border-[var(--color-border-default)] px-4 py-3 text-xs text-[var(--color-text-label)] outline-none transition-colors focus:border-[var(--color-border-focus)]"
              />
            </div>

            <button
              type="submit"
              className={buttonStyles({ variant: 'primary', className: 'w-full' })}
            >
              {submitted ? t('sent') : t('submit')}
            </button>
          </form>
        </Reveal>

        <Reveal delay={0.1} className="order-1 lg:order-2">
          <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-[var(--color-navy-800)]">
            <Image src="/images/contact-panel-bg.png" alt="" fill className="object-cover" />
            <div className="absolute inset-0 bg-[var(--color-navy-800)]/30" />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
