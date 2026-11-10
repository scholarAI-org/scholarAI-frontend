// Dev-only fake backend for the FE-11 / FE-12 screenshots. Not imported by
// anything under src/ (the import guard in tests/student-saved-scholarships.test.mjs
// enforces that). Payloads are shaped like the LIVE OpenAPI schemas
// (ScholarshipDetailsResponse, ScholarshipEligibilityResponse,
// ScholarshipTrackingResponse, ScholarshipReportCreate/Response).
//
//   node scripts/fe-11-fake-backend.mjs            # listens on 127.0.0.1:4111
//
// Scholarship ids:  564 full data · 565 only the required fields · 566 saved,
// already tracked · 404 not found · 500 server error. Anything else is a 404.
// A report whose description contains force409 / force429 / force500 gets that
// status, so those states can be exercised from the browser.
import { createServer } from 'node:http';

const port = Number(process.env.PORT ?? 4111);

const full = {
  id: 564,
  title: 'Türkiye Scholarships (YTB)',
  title_ar: 'منحة تركيا الحكومية (YTB)',
  title_en: 'Türkiye Scholarships (YTB)',
  slug: 'ytb',
  organization_name: 'Presidency for Turks Abroad (YTB)',
  university_name: 'Istanbul University',
  country: 'Türkiye',
  image_url: null,
  study_level: ['master', 'phd'],
  funding_type: 'full',
  opportunity_type: 'scholarship',
  application_status: 'open',
  deadline: '2027-02-20',
  no_deadline: false,
  opening_date: '2026-11-01',
  is_saved: false,
  ingestion_type: 'scraped',
  source: 'turkiyeburslari.gov.tr',
  source_url: 'https://turkiyeburslari.gov.tr/',
  description_html: '<p>Stored source HTML is never rendered.</p>',
  funding_amount: '1,400 TRY monthly stipend, tuition and housing',
  language_requirements: 'English B2 or Turkish B1',
  eligible_nationalities: 'All nationalities except Turkish citizens',
  academic_year: '2027/2028',
  gpa_requirement: '75% or higher',
  age_requirement: 'Under 30 for master, under 35 for PhD',
  majors: ['Engineering', 'Medicine', 'Computer science', 'Law'],
  eligibility_criteria: [
    'Hold a bachelor degree for master programmes',
    'Not currently studying in Türkiye',
    'No criminal record',
  ],
  required_documents: [
    'Certified academic transcript',
    'Two recommendation letters',
    'Motivation letter (up to 1000 words)',
    'Copy of the passport',
    'English language certificate',
  ],
  apply_link: 'https://turkiyeburslari.gov.tr/apply',
  apply_email: 'info@turkiyeburslari.gov.tr',
  apply_phone: '+90 312 555 0100',
  pdf_url: 'https://turkiyeburslari.gov.tr/guide.pdf',
  attachments: ['https://turkiyeburslari.gov.tr/forms/a.pdf'],
  is_extension: false,
  published_at: '2026-10-20T08:00:00Z',
};

const minimal = { id: 565, title: 'Untitled opportunity', is_saved: false };

const fullEligibility = {
  id: 564,
  title: 'Türkiye Scholarships (YTB)',
  extracted_deadline: '2027-02-20',
  allowed_nationalities: ['Egypt', 'Jordan', 'Palestine'],
  target_degree_levels: ['master', 'phd'],
  allowed_gender: null,
  target_residencies: [],
  min_gpa_percentage: 75,
  max_age: 30,
  allowed_fields_of_study: ['Engineering', 'Medicine'],
  required_languages: ['English'],
  funding_type: 'full',
  is_req_experience: false,
  is_Softskills_required: true,
  required_documents: ['Transcript'],
};
const emptyEligibility = Object.fromEntries(Object.keys(fullEligibility).map((key) => [key, null]));

const scholarships = new Map([
  [
    564,
    {
      details: { ...full },
      eligibility: fullEligibility,
      tracking: { status: null, updated_at: null },
    },
  ],
  [
    565,
    {
      details: { ...minimal },
      eligibility: { ...emptyEligibility, id: 565, title: 'x' },
      tracking: { status: null, updated_at: null },
    },
  ],
  [
    566,
    {
      details: {
        ...full,
        id: 566,
        is_saved: true,
        title_en: 'Saved and tracked',
        title_ar: 'محفوظة ومتتبَّعة',
      },
      eligibility: fullEligibility,
      tracking: { status: 'applied', updated_at: '2026-10-25T10:00:00Z' },
    },
  ],
]);

const REPORT_TYPES = [
  'expired',
  'broken_link',
  'duplicate',
  'suspicious',
  'incorrect_information',
  'other',
];

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body === null ? '' : JSON.stringify(body));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8');
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return undefined;
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  const { pathname } = url;

  if (pathname === '/auth/me') {
    return send(res, 200, {
      id: '1',
      name: 'Test Student',
      email: 'student@example.org',
      role: 'student',
    });
  }

  const match = pathname.match(
    /^\/api\/scholarships\/(\d+)(?:\/(eligibility|tracking|save|reports))?$/
  );
  if (!match) return send(res, 404, { detail: 'Not found' });
  const id = Number(match[1]);
  const part = match[2];

  if (id === 500) return send(res, 500, { detail: 'Internal error' });
  const record = scholarships.get(id);
  if (!record) return send(res, 404, { detail: 'المنحة غير موجودة' });

  if (!part && req.method === 'GET') return send(res, 200, record.details);

  if (part === 'eligibility' && req.method === 'GET') return send(res, 200, record.eligibility);

  if (part === 'tracking') {
    if (req.method === 'GET') return send(res, 200, record.tracking);
    if (req.method === 'PUT') {
      const body = await readJson(req);
      if (!body || typeof body.status !== 'string')
        return send(res, 422, { detail: [{ msg: 'bad', loc: ['body'] }] });
      record.tracking = { status: body.status, updated_at: new Date().toISOString() };
      return send(res, 200, record.tracking);
    }
  }

  if (part === 'save') {
    if (req.method === 'POST') {
      record.details.is_saved = true;
      return send(res, 200, {
        id: 1,
        user_id: 1,
        scholarship_id: id,
        created_at: new Date().toISOString(),
        is_saved: true,
        message: 'تم حفظ المنحة بنجاح.',
      });
    }
    if (req.method === 'DELETE') {
      record.details.is_saved = false;
      return send(res, 200, {
        scholarship_id: id,
        is_saved: false,
        message: 'تم إلغاء حفظ المنحة بنجاح.',
      });
    }
  }

  if (part === 'reports' && req.method === 'POST') {
    const body = await readJson(req);
    if (!body || !REPORT_TYPES.includes(body.report_type))
      return send(res, 422, {
        detail: [{ msg: 'invalid report_type', loc: ['body', 'report_type'] }],
      });
    const description = typeof body.description === 'string' ? body.description : '';
    if ([...description].length > 2000)
      return send(res, 422, { detail: [{ msg: 'too long', loc: ['body', 'description'] }] });
    if (description.includes('force409'))
      return send(res, 409, { detail: 'لديك بلاغ غير محسوم من هذا النوع' });
    if (description.includes('force429')) return send(res, 429, { detail: 'Too many requests' });
    if (description.includes('force500')) return send(res, 500, { detail: 'Internal error' });
    return send(res, 201, {
      id: 77,
      scholarship_id: id,
      reporter_user_id: 1,
      report_type: body.report_type,
      description: description.trim() || null,
      status: 'pending',
      created_at: new Date().toISOString(),
      message: 'تم إرسال البلاغ بنجاح وسيتم مراجعته من قبل الإدارة.',
    });
  }

  send(res, 405, { detail: 'Method not allowed' });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`[fe-11-fake-backend] listening on http://127.0.0.1:${port}`);
});
