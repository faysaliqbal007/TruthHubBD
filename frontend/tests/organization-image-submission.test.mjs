import test from 'node:test';
import assert from 'node:assert/strict';
import {businessService,BusinessSubmissionError} from '../src/services/businessService.ts';

test('organization selected image is multipart without a manually set boundary',async()=>{
  const originalFetch=globalThis.fetch;const requests=[];
  globalThis.fetch=async(url,options)=>{requests.push({url,options});return new Response(JSON.stringify(url.endsWith('/businesses')?{data:{id:1,image:null,profileImageStatus:'pending'}}:{}),{status:url.endsWith('/businesses')?201:200,headers:{'Content-Type':'application/json'}});};
  try{
    const image=new File(['fictional test bytes'],'logo.png',{type:'image/png'});
    await businessService.createBusiness({name:'Fictional Organization',category:'Products',presence:'online',profile_image:image,profile_image_consent:true});
    const {options}=requests.at(-1);
    assert.ok(options.body instanceof FormData);
    assert.equal(options.headers['Content-Type'],undefined);
    assert.equal(options.credentials,'include');
    assert.equal(options.body.get('profile_image').name,'logo.png');
    assert.equal(options.body.get('profile_image_consent'),'1');
    assert.equal(options.body.get('name'),'Fictional Organization');
    assert.equal(options.body.get('division_id'),null);
  }finally{globalThis.fetch=originalFetch;}
});

test('organization without image retains its JSON request contract',async()=>{
  const originalFetch=globalThis.fetch;let submission;
  globalThis.fetch=async(url,options)=>{if(url.endsWith('/businesses'))submission=options;return new Response(JSON.stringify({data:{id:1}}),{status:200});};
  try{
    await businessService.createBusiness({name:'Fictional Organization',category:'Products'});
    assert.equal(submission.headers['Content-Type'],'application/json');
    assert.deepEqual(JSON.parse(submission.body),{name:'Fictional Organization',category:'Products'});
  }finally{globalThis.fetch=originalFetch;}
});

test('upload field errors survive the service for visible inline feedback',async()=>{
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async url=>url.endsWith('/businesses')?new Response(JSON.stringify({message:'The image is invalid.',errors:{profile_image:['Choose a real image.']}}),{status:422}):new Response('{}',{status:200});
  try{await assert.rejects(()=>businessService.createBusiness({name:'Fictional Organization',category:'Products'}),error=>error instanceof BusinessSubmissionError&&error.fieldErrors.profile_image[0]==='Choose a real image.');}finally{globalThis.fetch=originalFetch;}
});
