// Ports and URLs shared by playwright.config.ts and the tests.
export const E2E_PORTS = { fakeBackend: 4010, appFlagsOn: 3100, appFlagsOff: 3101 } as const;

// Set E2E_BASE_URL to point the read-only specs at a deployed environment instead.
const remoteBaseUrl = process.env.E2E_BASE_URL?.replace(/\/+$/, '');

export const isRemoteTarget = Boolean(remoteBaseUrl);

export const E2E_URLS = {
  fakeBackend: `http://127.0.0.1:${E2E_PORTS.fakeBackend}`,
  appFlagsOn: remoteBaseUrl ?? `http://127.0.0.1:${E2E_PORTS.appFlagsOn}`,
  appFlagsOff: `http://127.0.0.1:${E2E_PORTS.appFlagsOff}`,
} as const;
