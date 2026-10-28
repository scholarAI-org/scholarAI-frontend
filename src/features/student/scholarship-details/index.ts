// Public entry points for scholarship-details sub-feature.
export { ScholarshipDetailsPage } from './components/ScholarshipDetailsPage';
export { ScholarshipDetailsView } from './components/ScholarshipDetailsView';
export { getScholarshipDetails } from './api/scholarship-details';
export { useScholarshipDetailsQuery } from './hooks/useScholarshipDetailsQuery';
export { parseScholarshipDetails, toDetailsView, DetailsContractError } from './lib/adapter';
export type { ScholarshipDetailsData, ScholarshipDetailsViewModel } from './types';
