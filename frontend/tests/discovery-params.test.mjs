import test from 'node:test';
import assert from 'node:assert/strict';
import {discoveryPage, discoveryView, switchDiscoveryView, updateReviewFilter} from '../src/lib/discoveryParams.ts';

test('discovery starts with reviews and explicit searches start with businesses', () => {
  assert.equal(discoveryView(new URLSearchParams()), 'reviews');
  assert.equal(discoveryView(new URLSearchParams({q: '   '})), 'reviews');
  assert.equal(discoveryView(new URLSearchParams({q: 'parcel'})), 'businesses');
  assert.equal(discoveryView(new URLSearchParams({q: 'parcel', view: 'reviews'})), 'reviews');
  assert.equal(discoveryView(new URLSearchParams({view: 'businesses'})), 'businesses');
  assert.equal(discoveryView(new URLSearchParams({view: 'unsupported'})), 'reviews');
});

test('view switching preserves shared search filters and resets unrelated pagination', () => {
  const original = new URLSearchParams({q: 'A & B দোকান', category: 'Products', location: 'Dhaka Division', page: '7', min_rating: '4'});
  const reviews = switchDiscoveryView(original, 'reviews');
  assert.equal(reviews.get('q'), 'A & B দোকান');
  assert.equal(reviews.get('category'), 'Products');
  assert.equal(reviews.get('location'), 'Dhaka Division');
  assert.equal(reviews.get('view'), 'reviews');
  assert.equal(reviews.has('page'), false);
  assert.equal(original.get('page'), '7');
  const sharedUrl = new URL('/search?' + reviews, 'https://example.test');
  assert.equal(discoveryView(sharedUrl.searchParams), 'reviews');
  assert.equal(sharedUrl.searchParams.get('q'), 'A & B দোকান');
  assert.equal(switchDiscoveryView(reviews, 'businesses').get('min_rating'), '4');
});

test('review filter updates retain their view and other filters, while all-category sentinels clear', () => {
  const original = new URLSearchParams({view: 'businesses', q: 'parcel', category: 'Products', location: 'Sylhet Division', page: '3'});
  const changed = updateReviewFilter(original, 'q', '  clear communication  ');
  assert.equal(changed.get('view'), 'reviews');
  assert.equal(changed.get('q'), 'clear communication');
  assert.equal(changed.get('location'), 'Sylhet Division');
  assert.equal(changed.has('page'), false);
  assert.equal(updateReviewFilter(changed, 'category', 'All Categories').has('category'), false);
  assert.equal(updateReviewFilter(changed, 'location', 'All Bangladesh').has('location'), false);
  assert.equal(original.get('view'), 'businesses');
});

test('invalid or unsafe page values do not produce invalid API requests', () => {
  for (const value of ['0', '-1', '1.5', 'Infinity', 'not-a-number', '9007199254740992']) assert.equal(discoveryPage(new URLSearchParams({page: value})), 1);
  assert.equal(discoveryPage(new URLSearchParams()), 1);
  assert.equal(discoveryPage(new URLSearchParams({page: '12'})), 12);
});
