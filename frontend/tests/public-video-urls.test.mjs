import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePublicVideoUrls} from '../src/lib/publicVideoUrls.ts';

test('supports public provider video URLs without downloading and deduplicates lines',()=>{
 const url='https://www.youtube.com/watch?v=dQw4w9WgXcQ';
 assert.deepEqual(parsePublicVideoUrls(url+'\n'+url),{urls:[url]});
 assert.equal(parsePublicVideoUrls('https://vimeo.com/123456789\nhttps://www.tiktok.com/@example/video/123456789').error,undefined);
 assert.deepEqual(parsePublicVideoUrls('https://youtu.be/dQw4w9WgXcQ?si=tracking\n'+url),{urls:[url]});
 assert.deepEqual(parsePublicVideoUrls('https://player.vimeo.com/video/123456'),{urls:['https://vimeo.com/123456']});
 assert.deepEqual(parsePublicVideoUrls('https://www.facebook.com/page/videos/12345'),{urls:['https://www.facebook.com/watch/?v=12345']});
});
test('rejects private endpoints credentials protocols unrelated paths and more than three links',()=>{
 for(const url of ['javascript:alert(1)','http://youtube.com/watch?v=dQw4w9WgXcQ','https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ','https://user:pass@youtube.com/watch?v=dQw4w9WgXcQ','https://127.0.0.1/video','https://vimeo.com/settings','https://www.youtube.com/playlist?list=example','https://youtube.com/watch?v=short']) assert.equal(parsePublicVideoUrls(url).error,'invalid',url);
 assert.equal(parsePublicVideoUrls([1,2,3,4].map(id=>'https://vimeo.com/'+id).join('\n')).error,'count');
 for(const url of ['https://youtube.com:443/watch?v=dQw4w9WgXcQ','https://youtube.com/watch?v=dQw4w9WgXcQ#fragment','https://facebook.com/page/videos/notnumeric','https://tiktok.com/@user%20name/video/123','https://vimeo.com/%0a123','https://vimeo.com/123\\x']) assert.equal(parsePublicVideoUrls(url).error,'invalid',url);
});
