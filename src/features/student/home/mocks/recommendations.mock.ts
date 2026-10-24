import { HOME_MOCK_MARKER } from './marker';

const demoCard = (id: number, title: string, titleAr: string, score: number) => ({
  id,
  title,
  title_ar: titleAr,
  title_en: title,
  slug: null,
  organization_name: null,
  university_name: null,
  country: 'Germany',
  study_level: ['master'],
  funding_type: 'full',
  opportunity_type: 'scholarship',
  image_url: null,
  deadline: null,
  no_deadline: true,
  is_saved: false,
  match: { score },
});

// DEMO payload shaped like the REQUESTED contract (contracts/requested-backend.openapi.yaml).
export const recommendationsRaw = () => ({
  __source: HOME_MOCK_MARKER,
  locked: false,
  items: [
    demoCard(
      101,
      'DAAD Development-Related Postgraduate Courses',
      'منحة DAAD الألمانية للتنمية',
      91
    ),
    demoCard(102, 'Chevening Scholarships', 'برنامج منح Chevening البريطانية', 84),
    demoCard(103, 'Türkiye Scholarships', 'منحة الحكومة التركية المميزة', 78),
  ],
});
