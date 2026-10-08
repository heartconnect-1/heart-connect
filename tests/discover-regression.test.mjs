import test from 'node:test';
import assert from 'node:assert/strict';
import { createDiscoverRequestGate, mergeDiscoverProfiles } from '../src/lib/discover-state.js';

function deferred() {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return { promise, resolve };
}

test('removes duplicates within a single API response', () => {
  const page = [{ id: 'a' }, { id: 'a' }, { id: 'b' }];
  assert.deepEqual(mergeDiscoverProfiles([], page), [{ id: 'a' }, { id: 'b' }]);
});

test('removes duplicates across accumulated pages while preserving first-seen order', () => {
  const first = [{ id: 'a' }, { id: 'b' }];
  const second = [{ id: 'b' }, { id: 'c' }, { id: 'a' }];
  assert.deepEqual(mergeDiscoverProfiles(first, second), [{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
});

test('drops records without a stable member ID', () => {
  assert.deepEqual(mergeDiscoverProfiles([], [{ name: 'no id' }, { id: '' }, { id: 'ok' }]), [{ id: 'ok' }]);
});

test('empty pages preserve existing recommendations', () => {
  const first = [{ id: 'a' }];
  assert.deepEqual(mergeDiscoverProfiles(first, []), first);
});

test('reset clears profiles, skipped IDs and pagination, then accepts fresh results', async () => {
  const gate = createDiscoverRequestGate();
  let profiles = [{ id: 'old' }];
  let skipped = ['old'];
  let cursor = 50;
  gate.invalidate();
  profiles = [];
  skipped = [];
  cursor = 0;
  const refreshToken = gate.beginRefresh();
  assert.deepEqual(profiles, []);
  assert.deepEqual(skipped, []);
  assert.equal(cursor, 0);
  const response = deferred();
  response.resolve({ items: [{ id: 'fresh' }], nextOffset: 50 });
  const result = await response.promise;
  if (gate.isCurrent(refreshToken)) {
    profiles = mergeDiscoverProfiles([], result.items);
    cursor = result.nextOffset;
  }
  assert.deepEqual(profiles, [{ id: 'fresh' }]);
  assert.equal(cursor, 50);
});

test('only one overlapping Load More request is admitted and cursor advances once', async () => {
  const gate = createDiscoverRequestGate();
  let profiles = [{ id: 'a' }];
  let cursor = 50;
  const firstPage = deferred();
  const token = gate.beginPage();
  assert.equal(token, 0);
  assert.equal(gate.beginPage(), null, 'second concurrent Load More must be ignored');
  firstPage.resolve({ items: [{ id: 'a' }, { id: 'b' }], nextOffset: 100 });
  const result = await firstPage.promise;
  if (gate.isCurrent(token)) {
    profiles = mergeDiscoverProfiles(profiles, result.items);
    cursor = result.nextOffset;
  }
  gate.finishPage(token);
  assert.deepEqual(profiles, [{ id: 'a' }, { id: 'b' }]);
  assert.equal(cursor, 100);
  assert.equal(gate.beginPage(), 0, 'next page becomes available after request finishes');
});

test('a refresh wins over an older in-flight pagination response', async () => {
  const gate = createDiscoverRequestGate();
  let profiles = [{ id: 'old-page-1' }];
  let cursor = 50;
  const page = deferred();
  const pageToken = gate.beginPage();
  const refreshToken = gate.beginRefresh();
  const refresh = { items: [{ id: 'new-set' }], nextOffset: 50 };
  if (gate.isCurrent(refreshToken)) {
    profiles = mergeDiscoverProfiles([], refresh.items);
    cursor = refresh.nextOffset;
  }
  page.resolve({ items: [{ id: 'stale-page' }], nextOffset: 100 });
  const stale = await page.promise;
  if (gate.isCurrent(pageToken)) {
    profiles = mergeDiscoverProfiles(profiles, stale.items);
    cursor = stale.nextOffset;
  }
  gate.finishPage(pageToken);
  assert.deepEqual(profiles, [{ id: 'new-set' }]);
  assert.equal(cursor, 50);
});

test('filter changes invalidate pending responses without restoring the prior result set', async () => {
  const gate = createDiscoverRequestGate();
  let profiles = [{ id: 'current' }];
  let cursor = 50;
  const pending = deferred();
  const token = gate.beginPage();
  gate.invalidate();
  pending.resolve({ items: [{ id: 'stale-filter-result' }], nextOffset: 100 });
  const result = await pending.promise;
  if (gate.isCurrent(token)) {
    profiles = mergeDiscoverProfiles(profiles, result.items);
    cursor = result.nextOffset;
  }
  assert.deepEqual(profiles, [{ id: 'current' }]);
  assert.equal(cursor, 50);
});

test('a stale first-page refresh cannot overwrite a newer filter reset refresh', async () => {
  const gate = createDiscoverRequestGate();
  let profiles = [{ id: 'before-reset' }];
  let cursor = 100;
  const oldRefresh = deferred();
  const oldToken = gate.beginRefresh();
  const newToken = gate.beginRefresh();
  oldRefresh.resolve({ items: [{ id: 'obsolete' }], nextOffset: 150 });
  const result = await oldRefresh.promise;
  if (gate.isCurrent(oldToken)) {
    profiles = mergeDiscoverProfiles([], result.items);
    cursor = result.nextOffset;
  }
  if (gate.isCurrent(newToken)) {
    profiles = [{ id: 'after-reset' }];
    cursor = 50;
  }
  assert.deepEqual(profiles, [{ id: 'after-reset' }]);
  assert.equal(cursor, 50);
});
