import { HOME_MOCK_MARKER } from './marker';

const HOUR = 3_600_000;

// DEMO payload shaped like the REQUESTED contract; times are relative to `now`
// so the relative-time labels look right whenever the page is opened.
export const activityRaw = (now: Date = new Date()) => {
  const ago = (hours: number) => new Date(now.getTime() - hours * HOUR).toISOString();
  return {
    __source: HOME_MOCK_MARKER,
    items: [
      {
        id: 904,
        type: 'new_recommendation',
        occurred_at: ago(3),
        scholarship: {
          id: 42,
          title: 'Fulbright Foreign Student Program',
          title_ar: 'منحة فولبرايت',
          title_en: 'Fulbright Foreign Student Program',
        },
        data: {},
      },
      {
        id: 903,
        type: 'deadline_reminder',
        occurred_at: ago(24),
        scholarship: {
          id: 17,
          title: 'Türkiye Scholarships',
          title_ar: 'منحة الحكومة التركية',
          title_en: 'Türkiye Scholarships',
        },
        data: { days_left: 7 },
      },
      {
        id: 902,
        type: 'scholarship_saved',
        occurred_at: ago(48),
        scholarship: {
          id: 23,
          title: 'Birzeit University Scholarships',
          title_ar: 'منح جامعة بيرزيت',
          title_en: 'Birzeit University Scholarships',
        },
        data: {},
      },
      {
        id: 901,
        type: 'application_status_changed',
        occurred_at: ago(96),
        scholarship: {
          id: 17,
          title: 'Türkiye Scholarships',
          title_ar: 'منحة الحكومة التركية',
          title_en: 'Türkiye Scholarships',
        },
        data: { new_status: 'applied' },
      },
    ],
  };
};
