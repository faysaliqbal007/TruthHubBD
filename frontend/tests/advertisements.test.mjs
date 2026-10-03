import test from 'node:test';
import assert from 'node:assert/strict';
import {adDestination,adImageUrl,adWritePayload,blankAdDraft,dhakaDateInput,dhakaDateIso,getPublicAdvertisements,getPublicAdvertisementTicker,safeHttpsAdUrl,scheduleText,validateAdDraft} from '../src/services/advertisements.ts';

test('ad destinations reject private or active links and retain safe organization fallback',()=>{
 for(const url of ['javascript:alert(1)','http://example.org','https://localhost','https://127.0.0.1','https://user:secret@example.org','https://intranet.local','https://example.org:8000','https://example.test']) assert.equal(safeHttpsAdUrl(url),null);
 assert.equal(safeHttpsAdUrl('https://example.org/notice'),'https://example.org/notice');
 assert.deepEqual(adDestination({destination_url:'javascript:alert(1)',organization:{url:'/business/example-clinic'}}),{url:'/business/example-clinic',external:false});
 assert.equal(adDestination({destination_url:null,organization:{url:'//external.example'}}),null);
});
test('ad artwork uses approved photos, supplied local creatives or original illustrations only',()=>{
 assert.equal(adImageUrl({sector:'education',image:{kind:'illustration',url:'/advertisement-media/education.svg'}}).url,'/advertisement-media/education.svg');
 assert.equal(adImageUrl({sector:'general',image:{kind:'photo',url:'/api/businesses/4/profile-image'}}).photo,true);
 for(const url of ['/storage/private/file.jpg','https://tracker.example/image.png','/api/businesses/4/evidence']) assert.equal(adImageUrl({sector:'healthcare',image:{kind:'photo',url}}).photo,false);
 assert.equal(adImageUrl({sector:'education',image:{kind:'creative',url:'/advertisement-media/reference-education.jpg'}}).url,'/advertisement-media/reference-education.jpg');
 assert.equal(adImageUrl({sector:'education',image:{kind:'creative',url:'/storage/private/claim.jpg'}}).url,'/advertisement-media/education.svg');
});
test('Dhaka schedule values round-trip and reject invalid calendar dates',()=>{
 assert.equal(dhakaDateIso('2026-10-01T10:00'),'2026-10-01T04:00:00.000Z');
 assert.equal(dhakaDateInput('2026-10-01T04:00:00.000Z'),'2026-10-01T10:00');
 assert.equal(dhakaDateIso('2026-02-30T10:00'),null);
 assert.equal(dhakaDateIso('not a date'),null);
});
test('ad writes require bilingual content, valid highlights, scheduling and private rationale',()=>{
 const draft={...blankAdDraft(),title_en:'Education notice',title_bn:'শিক্ষার বিজ্ঞপ্তি',body_en:'Clear course information.',body_bn:'কোর্সের স্পষ্ট তথ্য।',bullets_en:' Fees \n Schedule ',bullets_bn:' ফি \n সময়সূচি ',decision_rationale:'Reviewed the details before publication.'};
 assert.deepEqual(validateAdDraft(draft,'en'),{});
 const payload=adWritePayload(draft,'draft');assert.deepEqual(payload.bullets_en,['Fees','Schedule']);assert.equal(payload.organization_id,null);assert.equal(payload.destination_url,null);assert.equal('is_sample' in payload,false);
 const invalid={...draft,bullets_en:'1\n2\n3\n4',ends_at:'2026-10-01T10:00',starts_at:'2026-10-02T10:00',decision_rationale:'short'};
 assert.deepEqual(Object.keys(validateAdDraft(invalid,'en')).sort(),['bullets_en','decision_rationale','ends_at']);
 assert.deepEqual(Object.keys(validateAdDraft({...draft,image_source:'creative_image',creative_image_path:'https://tracker.example/logo.png'},'en')),['creative_image_path']);
 const creative={...draft,image_source:'creative_image',creative_image_path:'/advertisement-media/reference-healthcare.jpg'};
 assert.deepEqual(validateAdDraft(creative,'en'),{});assert.equal(adWritePayload(creative,'published').creative_image_path,creative.creative_image_path);
});
test('public advertisement request omits credentials and surfaces unavailable responses',async()=>{
 const original=globalThis.fetch;let options;
 try{globalThis.fetch=async(url,init)=>{assert.match(url,/\/api\/advertisements$/);options=init;return new Response(JSON.stringify({data:[{id:3,is_sample:true}]}),{headers:{'Content-Type':'application/json'}});};
 assert.equal((await getPublicAdvertisements())[0].is_sample,true);assert.equal(options.credentials,'omit');
 globalThis.fetch=async()=>new Response(JSON.stringify({message:'Unavailable'}),{status:503,headers:{'Content-Type':'application/json'}});await assert.rejects(getPublicAdvertisements(),/Unavailable/);
 }finally{globalThis.fetch=original;}
});
test('ticker placement and bilingual short copy survive validated writes',()=>{
 const draft={...blankAdDraft(),title_en:'Education notice',title_bn:'শিক্ষার বিজ্ঞপ্তি',body_en:'Programme details.',body_bn:'কার্যক্রমের বিস্তারিত।',decision_rationale:'Reviewed the homepage placement.',show_in_ticker:false,ticker_text_en:'Read the course details',ticker_text_bn:'কোর্সের বিস্তারিত পড়ুন'};
 assert.deepEqual(validateAdDraft(draft,'en'),{});const payload=adWritePayload(draft,'published');assert.equal(payload.show_in_ticker,false);assert.equal(payload.ticker_text_bn,draft.ticker_text_bn);
 assert.equal('published_at' in payload,false);assert.deepEqual(Object.keys(validateAdDraft({...draft,ticker_text_en:'a'.repeat(501)},'en')),['ticker_text_en']);
});
test('public ticker uses its own endpoint and preserves the administrator enabled flag',async()=>{
 const original=globalThis.fetch;try{globalThis.fetch=async(url,init)=>{assert.match(url,/\/api\/advertisement-ticker$/);assert.equal(init.credentials,'omit');return new Response(JSON.stringify({data:{enabled:false,policy_en:'Policy',policy_bn:'নীতি',items:[]}}),{headers:{'Content-Type':'application/json'}});};assert.equal((await getPublicAdvertisementTicker()).enabled,false);}finally{globalThis.fetch=original;}
});
test('ad dates show recorded publication or a real schedule, never a fabricated expiry',()=>{
 assert.equal(scheduleText({starts_at:null,ends_at:null,published_at:'2026-10-02T08:00:00Z'},'en'),'Published 2 Oct 2026');
 assert.match(scheduleText({starts_at:null,ends_at:null},'en'),/not supplied/);
 assert.match(scheduleText({starts_at:null,ends_at:'2026-10-08T08:00:00Z'},'en'),/^Until /);
});
