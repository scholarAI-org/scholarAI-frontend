// Wire-shaped BE-13 payloads for the Student Notifications unit tests (Feature 011).

export const PARAMS = {
  deadline_reminder: {
    scholarship_id: 7,
    scholarship_title: 'DAAD',
    days_left: 17,
    deadline: '2026-09-15',
    reminder_index: 1,
    reminder_total: 2,
    missing_documents: ['recommendation_letters'],
  },
  scholarship_match: {
    scholarship_id: 8,
    scholarship_title: 'Erasmus Mundus',
    matched_count: 4,
    total_count: 5,
  },
  saved_scholarship_updated: {
    scholarship_id: 9,
    scholarship_title: 'Chevening',
    change: 'language_requirement_added',
  },
  scholarship_archived: { scholarship_id: 10, scholarship_title: 'Islamic University 2025' },
  profile_incomplete: { remaining_percent: 18, threshold_percent: 70 },
  document_analysis_ready: { suggestions_count: 8, target_scholarship_title: 'DAAD' },
};

// The action the backend attaches to each type (null for none).
export const ACTIONS = {
  deadline_reminder: { type: 'open_scholarship', target_id: 7 },
  scholarship_match: { type: 'open_scholarship', target_id: 8 },
  saved_scholarship_updated: { type: 'open_scholarship', target_id: 9 },
  scholarship_archived: null,
  profile_incomplete: { type: 'open_profile', target_id: null },
  document_analysis_ready: { type: 'open_document_analysis', target_id: null },
};

export const raw = (type, extra = {}) => ({
  id: 1,
  type,
  params: { ...PARAMS[type] },
  created_at: '2026-11-19T10:00:00Z',
  is_read: false,
  action: ACTIONS[type] ?? null,
  ...extra,
});

export const envelope = (items, extra = {}) => ({
  items,
  total: items.length,
  page: 1,
  page_size: 20,
  total_pages: 1,
  ...extra,
});

export const NOW = new Date('2026-11-19T12:00:00Z');
