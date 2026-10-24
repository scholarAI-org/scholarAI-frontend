// DEMO DATA. Reachable only through sources/create-home-sources.ts, only in local
// development, only for sections listed in HOME_MOCK_SECTIONS. Never import this
// file from anywhere else (guarded by a test).
import { activityRaw } from './activity.mock';
import { HOME_MOCK_MARKER } from './marker';
import { notificationsRaw } from './notifications.mock';
import { recommendationsRaw } from './recommendations.mock';

// Each function returns the RAW payload of the requested backend contract; the
// source factory validates it with the same parser the real client uses.
export const mockLoaders = { notificationsRaw, activityRaw, recommendationsRaw };
export { HOME_MOCK_MARKER };
