import assert from 'node:assert/strict';
import test from 'node:test';
import {notificationContent, notificationDestination} from '../src/lib/notificationContent.ts';

const alert = {id: 1, type: 'case_alert', title: 'Admin-reviewed public case alert', body: 'THB-2026-ABCD: A reviewed public case update is available. Platform review is not a finding of legal guilt.', url: '/scam-alerts/THB-2026-ABCD'};

test('case alert translates the controlled template and retains only its public case code', () => {
  const text = notificationContent({...alert, title: 'Private allegation marker', body: 'Private evidence marker'}, 'bn');
  assert.equal(text.original, false);
  assert.match(text.title, /প্রশাসক পর্যালোচিত/);
  assert.match(text.body, /^THB-2026-ABCD: /);
  assert.match(text.body, /আইনি অপরাধের সিদ্ধান্ত নয়/);
  assert.doesNotMatch(text.body + text.title, /Private|evidence|allegation/);
});

test('case code fallback uses only an exact controlled message', () => {
  assert.match(notificationContent({...alert, url: null}, 'en').body, /^THB-2026-ABCD:/);
  const text = notificationContent({...alert, url: '/activity', body: 'Private claimant: Allegation copied here'}, 'en');
  assert.equal(text.body, 'A reviewed public case update is available. Platform review is not a finding of legal guilt.');
  assert.doesNotMatch(text.body, /Private claimant|Allegation/);
});

test('only the known review comment template is translated; arbitrary staff messages stay original', () => {
  const comment = {id: 2, type: 'review_comment', title: 'New comment on your review', body: 'Someone joined the conversation on your review.'};
  assert.equal(notificationContent(comment, 'bn').title, 'আপনার রিভিউতে নতুন মন্তব্য');
  const note = {...comment, body: 'A staff member supplied this exact message.'};
  assert.deepEqual(notificationContent(note, 'bn'), {title: note.title, body: note.body, original: true});
  assert.deepEqual(notificationContent(note, 'en'), {title: note.title, body: note.body, original: false});
});

test('notification links accept internal app routes and reject external or malformed destinations', () => {
  for (const value of ['/scam-alerts/THB-2026-ABCD', '/reviews/12', '/activity', '/reviews/12#discussion']) assert.equal(notificationDestination(value), value);
  for (const value of [null, undefined, '', 'https://example.test', '//example.test', '/%2Fexample.test', '/\\example.test', '/%5Cexample.test', '/broken%', '/path\n']) assert.equal(notificationDestination(value), undefined);
});
