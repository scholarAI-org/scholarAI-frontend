// Public entry points for scholarship-details sub-feature.
export { ScholarshipDetailsPage } from './components/ScholarshipDetailsPage';
export { ScholarshipDetailsView } from './components/ScholarshipDetailsView';
export { getScholarshipDetails } from './api/scholarship-details';
export { useScholarshipDetailsQuery } from './hooks/useScholarshipDetailsQuery';
export { validateDetailsResponse, DetailsContractError } from './lib/validateDetailsResponse';
export type { ScholarshipDetailsModel, ScholarshipDetailsResponse } from './types';
