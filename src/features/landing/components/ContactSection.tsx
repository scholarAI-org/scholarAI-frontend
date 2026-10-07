'use client';

import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { Container } from '@/components/shared/Container';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SectionHeading } from './SectionHeading';

const FIELDS = ['name', 'email', 'subject', 'message'] as const;
export function ContactSection() {
  const t = useTranslations('Landing.updated.contact');
  const [submitted, setSubmitted] = useState(false);
  const labels = t.raw('labels') as string[];
  const placeholders = t.raw('placeholders') as string[];
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // There is no contact endpoint in this project. Keep entered data and report honestly.
    setSubmitted(true);
  }
  return (
    <section id="contact" className="landing-contact">
      <Container>
        <div className="landing-narrow">
          <SectionHeading badge={t('badge')} heading={t('heading')} subtitle={t('subtitle')} />
          <form onSubmit={handleSubmit}>
            {FIELDS.map((name, i) => (
              <div key={name} className="contact-field" data-landing-reveal={i % 2}>
                <Label htmlFor={`contact-${name}`}>{labels[i]}</Label>
                {name === 'message' ? (
                  <textarea
                    id={`contact-${name}`}
                    name={name}
                    required
                    rows={4}
                    placeholder={placeholders[i]}
                  />
                ) : (
                  <Input
                    id={`contact-${name}`}
                    name={name}
                    type={name === 'email' ? 'email' : 'text'}
                    required
                    autoComplete={name === 'name' ? 'name' : name === 'email' ? 'email' : undefined}
                    placeholder={placeholders[i]}
                  />
                )}
              </div>
            ))}
            <Button type="submit" variant="landing" className="contact-submit">
              {t('submit')}
            </Button>
            {submitted && (
              <p role="status" className="contact-status">
                {t('unavailable')}
              </p>
            )}
          </form>
        </div>
      </Container>
    </section>
  );
}
