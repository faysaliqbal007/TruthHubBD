import test from 'node:test';
import assert from 'node:assert/strict';
import {selectAttachments} from '../src/components/attachmentSelection.ts';
const photo=(name='photo.png',extra={})=>({name,size:1024,type:'image/png',lastModified:1,...extra});
test('separate selections append photos without duplicating the same file',()=>{
 const first=photo();const second=photo('second.jpg',{type:'image/jpeg'});
 assert.deepEqual(selectAttachments([first],[first,second,second]).files,[first,second]);
});
test('over-limit selection preserves existing photos',()=>{
 const existing=[photo()];const picked=Array.from({length:20},(_,i)=>photo('other'+i+'.png'));
 const result=selectAttachments(existing,picked);assert.equal(result.files,existing);assert.match(result.error,/up to 20/);
});
test('twenty files are accepted, and callers cannot raise the cap above twenty',()=>{
 const picked=Array.from({length:20},(_,i)=>photo('allowed'+i+'.png',{size:1024*1024}));
 assert.equal(selectAttachments([],picked).files.length,20);
 assert.match(selectAttachments(picked,[photo('twenty-first.png')],50).error,/up to 20/);
});
test('unsupported, empty and oversized files never replace a valid selection',()=>{
 const existing=[photo()];for(const invalid of [photo('bad.exe',{type:'application/x-msdownload'}),photo('empty.png',{size:0}),photo('large.png',{size:6*1024*1024})]){const result=selectAttachments(existing,[invalid],5,5);assert.equal(result.files,existing);assert.ok(result.error);}
});
test('removing a file permits selecting it again',()=>{
 const file=photo();const afterRemoval=[];assert.deepEqual(selectAttachments(afterRemoval,[file]).files,[file]);
});
test('combined size cap rejects a new batch without discarding existing files',()=>{
 const existing=[photo('kept.png',{size:1024*1024})];
 const picked=Array.from({length:4},(_,i)=>photo('large'+i+'.png',{size:9*1024*1024}));
 const result=selectAttachments(existing,picked);
 assert.equal(result.files,existing);
 assert.match(result.error,/must not exceed 35 MB/);
});
test('combined limit includes previous selections, allows exactly 35 MB and ignores duplicates',()=>{
 const existing=Array.from({length:3},(_,i)=>photo('first'+i+'.png',{size:10*1024*1024}));
 const last=photo('last.png',{size:5*1024*1024});
 const allowed=selectAttachments(existing,[existing[0],last]);
 assert.equal(allowed.error,'');
 assert.deepEqual(allowed.files,[...existing,last]);
 const rejected=selectAttachments(allowed.files,[photo('one-byte-too-many.png',{size:1})]);
 assert.equal(rejected.files,allowed.files);
 assert.match(rejected.error,/35 MB/);
});
