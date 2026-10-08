import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeDiscoverProfiles } from '../src/lib/discover-state.js';

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
