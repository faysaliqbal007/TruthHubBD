import test from 'node:test';
import assert from 'node:assert/strict';
import {AI_DEMO_ILLUSTRATION,isAiDemoIllustration,visiblePublicMedia} from '../src/lib/publicMedia.ts';

process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8001';

const image=(url,kind='photo')=>({url,kind,alt:'Approved public copy'});
test('known demo assets and AI illustration are allowed and identified explicitly',()=>{
 const ai=image(AI_DEMO_ILLUSTRATION,'illustration');
 assert.deepEqual(visiblePublicMedia([ai,image('/demo-media/delivery.svg','illustration')]),[ai,image('/demo-media/delivery.svg','illustration')]);
 assert.equal(isAiDemoIllustration(ai),true);
 assert.equal(isAiDemoIllustration(image(AI_DEMO_ILLUSTRATION)),false);
});
test('approved local photos and configured API-origin photos remain readable',()=>{
 const media=[image('/public-media/redacted-1.jpg'),image('/public-media/photo.PNG'),image('http://localhost:8001/public-media/approved.png')];
 assert.deepEqual(visiblePublicMedia(media),media);
});
test('private storage, trackers, traversal, active content and arbitrary demo files are rejected',()=>{
 const invalid=['private:receipt.png','/storage/review-evidence/secret.png','/public-media/../private.png','/public-media/%2e%2e/secret.png','//tracker.test/a.png','javascript:alert(1)','https://tracker.test/public-media/image.png','/public-media/image.png?track=1','/public-media/active.svg','http://localhost:8001/public-media/../public-media/image.png','http://user:pass@localhost:8001/public-media/image.png'];
 assert.deepEqual(visiblePublicMedia(invalid.map(url=>image(url))),[]);
 assert.deepEqual(visiblePublicMedia([image('/demo-media/unknown.png','illustration'),image(AI_DEMO_ILLUSTRATION)]),[]);
});
test('gallery respects server media limit and refuses missing alt text or unknown kinds',()=>{
 assert.equal(visiblePublicMedia(Array.from({length:25},(_,n)=>image(`/public-media/photo-${n}.png`))).length,20);
 assert.deepEqual(visiblePublicMedia([{...image('/public-media/photo.png'),alt:''},image('/public-media/photo.png','video')]),[]);
});
