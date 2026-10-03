import test from 'node:test';
import assert from 'node:assert/strict';
import {publicText,originalTextLabel,hasApprovedTranslation} from '../src/i18n/content.ts';
const original={title:'Original title',body:'Original body'};
test('approved locale text is displayed without modifying the original',()=>{
 const approved={...original,translations:{en:{body:'Reviewed English version'},bn:{title:'বাংলা শিরোনাম',body:'বাংলা লেখা'}}};
 assert.equal(publicText(approved,'body','bn'),'বাংলা লেখা');
 assert.equal(publicText(approved,'body','en'),'Reviewed English version');
 assert.equal(approved.body,'Original body');
 assert.equal(originalTextLabel(approved,'bn',['title','body']),'');
});
test('missing locale falls back to the original with a Bangla original-text notice',()=>{
 assert.equal(publicText(original,'body','bn'),'Original body');
 assert.ok(originalTextLabel(original,'bn',['title','body']));
 assert.equal(originalTextLabel(original,'en',['body']),'');
});
test('partial translations preserve missing fields and disclose the fallback',()=>{
 const partial={...original,translations:{bn:{title:'বাংলা শিরোনাম'}}};
 assert.equal(publicText(partial,'title','bn'),'বাংলা শিরোনাম');
 assert.equal(publicText(partial,'body','bn'),'Original body');
 assert.equal(hasApprovedTranslation(partial,'bn',['title','body']),false);
 assert.ok(originalTextLabel(partial,'bn',['title','body']));
});
test('blank translations do not hide original content',()=>{
 const blank={...original,translations:{bn:{body:'  '}}};
 assert.equal(publicText(blank,'body','bn'),'Original body');
 assert.equal(hasApprovedTranslation(blank,'bn',['body']),false);
});
