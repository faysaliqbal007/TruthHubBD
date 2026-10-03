import test from 'node:test';
import assert from 'node:assert/strict';
import {selectAlertFeedOrder} from '../src/lib/alertFeedOrder.ts';

test('trending selects reviewed alerts with newest-first ordering', () => {
  assert.deepEqual(selectAlertFeedOrder('Resolved', 'trending'), {status: 'Trending', sort: 'newest'});
});

test('leaving trending returns to public cases in the chosen order', () => {
  assert.deepEqual(selectAlertFeedOrder('Trending', 'oldest'), {status: 'All cases', sort: 'oldest'});
  assert.deepEqual(selectAlertFeedOrder('Trending', 'newest'), {status: 'All cases', sort: 'newest'});
});

test('chronological order changes preserve a separate case-status filter', () => {
  assert.deepEqual(selectAlertFeedOrder('Resolved', 'oldest'), {status: 'Resolved', sort: 'oldest'});
  assert.deepEqual(selectAlertFeedOrder('Published', 'newest'), {status: 'Published', sort: 'newest'});
});

test('unknown order values cannot produce unsupported API sort values', () => {
  assert.deepEqual(selectAlertFeedOrder('All cases', 'unexpected'), {status: 'All cases', sort: 'newest'});
});
