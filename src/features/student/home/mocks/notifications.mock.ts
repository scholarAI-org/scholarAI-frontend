import { HOME_MOCK_MARKER } from './marker';

// DEMO payload shaped like the REQUESTED contract (contracts/requested-backend.openapi.yaml).
export const notificationsRaw = () => ({ unread_count: 10, __source: HOME_MOCK_MARKER });
