import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
// A browser-like `window` first: TanStack Query only schedules intervals and focus handling when it
// finds one, and it decides that when it is loaded.
import './helpers/fake-window.mjs';
import {
  QueryClient,
  loadFeature,
  loadPackage,
  loadSrc,
} from './helpers/notifications-harness.mjs';

// Feature 011: the unread-count poller (FR-043, FR-044, SC-005), with a controlled clock.

const { ApiError } = loadSrc('lib/api-client.ts');

const { QueryObserver, focusManager } = loadPackage('@tanstack/react-query');
const { unreadDriverOptions } = loadFeature('lib/driver-options.ts');
const { unreadQueryOptions } = loadFeature('lib/unread-source.ts');

// A controlled clock, so a minute takes no time. Each test enables it and restores everything.
const settle = async () => {
  for (let index = 0; index < 20; index += 1) await Promise.resolve();
  mock.timers.tick(0);
  for (let index = 0; index < 20; index += 1) await Promise.resolve();
};
const advance = async (ms) => {
  mock.timers.tick(ms);
  await settle();
};

// A source whose answers the test scripts: a number is the unread count, an Error is thrown.
function pollerRig(answer) {
  const loads = [];
  const source = {
    kind: 'real',
    load: async () => {
      const index = loads.length;
      loads.push(index);
      const result = answer(index);
      if (result instanceof Error) throw result;
      return { unreadCount: result };
    },
  };
  const client = new QueryClient();
  client.mount(); // what QueryClientProvider does: wires the focus manager to the queries
  // No retry delay in the test; the rules under test are about what happens between polls.
  const driver = (marking = false) => ({ ...unreadDriverOptions(source, marking), retry: false });
  return { loads, source, client, driver };
}

async function withClock(run) {
  mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] });
  try {
    await run();
  } finally {
    focusManager.setFocused(undefined);
    mock.timers.reset();
  }
}

test('poller: one request on mount, then one a minute while the tab is visible', async () => {
  await withClock(async () => {
    const rig = pollerRig((index) => index + 1);
    const observer = new QueryObserver(rig.client, rig.driver());
    const unsubscribe = observer.subscribe(() => {});
    await settle();
    assert.equal(rig.loads.length, 1, 'on mount');
    await advance(59_000);
    assert.equal(rig.loads.length, 1, 'not before a minute');
    await advance(1_000);
    assert.equal(rig.loads.length, 2, 'after a minute');
    await advance(60_000);
    assert.equal(rig.loads.length, 3);
    assert.equal(observer.getCurrentResult().data.unreadCount, 3);
    unsubscribe();
  });
});

test('poller: nothing while the tab is hidden, and at once when it is visible again', async () => {
  await withClock(async () => {
    const rig = pollerRig(() => 2);
    const observer = new QueryObserver(rig.client, rig.driver());
    const unsubscribe = observer.subscribe(() => {});
    await settle();
    assert.equal(rig.loads.length, 1);

    focusManager.setFocused(false);
    await advance(300_000);
    assert.equal(rig.loads.length, 1, 'no request while hidden');

    focusManager.setFocused(true);
    await settle();
    assert.equal(rig.loads.length, 2, 'refetched on return, without waiting for the next tick');
    await advance(60_000);
    assert.equal(rig.loads.length, 3, 'and the rhythm continues');
    unsubscribe();
  });
});

for (const status of [401, 403, 404]) {
  test(`poller: a ${status} stops interval and focus requests; a manual retry resumes polling`, async () => {
    await withClock(async () => {
      const rig = pollerRig((index) => (index === 0 ? new ApiError('nope', [], status) : 5));
      const observer = new QueryObserver(rig.client, rig.driver());
      const unsubscribe = observer.subscribe(() => {});
      await settle();
      assert.equal(rig.loads.length, 1);
      assert.equal(observer.getCurrentResult().error.status, status);

      await advance(300_000);
      focusManager.setFocused(false);
      focusManager.setFocused(true);
      await settle();
      assert.equal(rig.loads.length, 1, 'no further automatic request');

      // The list's Retry refetches the count; when it succeeds, polling starts again.
      await observer.refetch();
      await settle();
      assert.equal(rig.loads.length, 2);
      assert.equal(observer.getCurrentResult().data.unreadCount, 5);
      await advance(60_000);
      assert.equal(rig.loads.length, 3, 'polling resumed');
      unsubscribe();
    });
  });
}

test('poller: a network error or a 5xx keeps the last count and the rhythm', async () => {
  await withClock(async () => {
    const rig = pollerRig((index) => (index === 1 ? new ApiError('boom', [], 503) : index + 3));
    const observer = new QueryObserver(rig.client, rig.driver());
    const unsubscribe = observer.subscribe(() => {});
    await settle();
    assert.equal(observer.getCurrentResult().data.unreadCount, 3);

    await advance(60_000);
    assert.equal(rig.loads.length, 2);
    assert.equal(observer.getCurrentResult().data.unreadCount, 3, 'the last count stays');
    assert.equal(observer.getCurrentResult().error.status, 503);

    await advance(60_000);
    assert.equal(rig.loads.length, 3, 'still polling');
    assert.equal(observer.getCurrentResult().data.unreadCount, 5);
    unsubscribe();
  });
});

test('poller: ticks wait while a mark request is pending, and are not queued', async () => {
  await withClock(async () => {
    const rig = pollerRig(() => 1);
    const observer = new QueryObserver(rig.client, rig.driver(true));
    const unsubscribe = observer.subscribe(() => {});
    await settle();
    assert.equal(rig.loads.length, 1, 'the mount request is not a poll');
    await advance(180_000);
    assert.equal(rig.loads.length, 1, 'no tick while marking');
    // The mark settles: the options change and the rhythm starts from now, with no burst.
    observer.setOptions(rig.driver(false));
    await advance(60_000);
    assert.equal(rig.loads.length, 2);
    unsubscribe();
  });
});

test('poller: an unavailable source never runs', async () => {
  await withClock(async () => {
    const rig = pollerRig(() => 1);
    const observer = new QueryObserver(rig.client, {
      ...unreadDriverOptions({ kind: 'unavailable' }, false),
      retry: false,
    });
    const unsubscribe = observer.subscribe(() => {});
    await advance(300_000);
    assert.equal(rig.loads.length, 0);
    unsubscribe();
  });
});

test('poller: five passive readers and one driver make one request a minute, not six', async () => {
  await withClock(async () => {
    const rig = pollerRig((index) => index + 1);
    const readers = Array.from({ length: 5 }, () => {
      const observer = new QueryObserver(rig.client, {
        ...unreadQueryOptions(rig.source),
        enabled: false,
      });
      return { observer, unsubscribe: observer.subscribe(() => {}) };
    });
    await settle();
    assert.equal(rig.loads.length, 0, 'passive readers never fetch');

    const driver = new QueryObserver(rig.client, rig.driver());
    const stop = driver.subscribe(() => {});
    await settle();
    await advance(60_000);
    await advance(60_000);
    await advance(60_000);
    assert.equal(rig.loads.length, 4, 'one on mount and one per minute');
    for (const { observer } of readers) {
      assert.equal(observer.getCurrentResult().data.unreadCount, 4, 'every reader sees the answer');
    }
    stop();
    for (const { unsubscribe } of readers) unsubscribe();
  });
});
