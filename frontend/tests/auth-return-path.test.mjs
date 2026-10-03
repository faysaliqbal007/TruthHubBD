import test from 'node:test';
import assert from 'node:assert/strict';
import {authReturnPath} from '../src/lib/authReturnPath.ts';

test('preserves a content report reference through sign-in',()=>{
 assert.equal(authReturnPath('/report?type=scam_case&id=7'),'/report?type=scam_case&id=7');
 assert.equal(authReturnPath('/reviews/9'),'/reviews/9');
 assert.equal(authReturnPath('/scam-alerts/submit'),'/scam-alerts/submit');
});
test('rejects external, malformed and unknown redirect targets',()=>{
 for(const value of [null,'https://evil.test','//evil.test','/\\evil.test','/admin/unknown','/reporting','/report\n','/report/../admin']) assert.equal(authReturnPath(value),'/profile');
});
test('staff return paths preserve protected destinations without granting authorization',()=>{
 for(const path of ['/admin','/admin/organizations','/admin/audit','/moderation','/moderation/reports','/security?next=%2Fadmin','/profile?personal=1']) assert.equal(authReturnPath(path),path);
});
test('preserves notification, discovery, ad-report and discussion destinations',()=>{
 for(const path of ['/notifications','/search?view=reviews&q=Dhaka','/ads','/admin/ads','/report?type=advertisement&id=3','/reviews/9#discussion']) assert.equal(authReturnPath(path),path);
});
