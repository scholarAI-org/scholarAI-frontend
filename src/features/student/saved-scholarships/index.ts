// Public entry points for the saved-scholarships sub-feature.
// Must NOT re-export discovery-card types or redefine toScholarshipCard;
// consumers import those from scholarship-discovery/ directly.
export { SavedScholarshipsPage } from './components/SavedScholarshipsPage';
export { useSavedScholarshipsQuery } from './hooks/useSavedScholarshipsQuery';
export { SavedContractError, validateSavedResponse } from './lib/validateSavedResponse';
