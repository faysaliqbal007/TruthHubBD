/** Syntax/provider checks only, matching the API. Never requests or downloads a URL. */
function normalizePublicVideoUrl(text: string): string | null {
  if(text.length>2048 || /[\\\x00-\x20\x7f]/.test(text) || /%(?:0[0-9a-f]|1[0-9a-f]|7f)/i.test(text))return null;
  try {
    const url=new URL(text);
    // Explicit ports and fragments are rejected even when URL normalizes port 443 away.
    if(url.protocol!=='https:' || url.username || url.password || url.hash || /^https:\/\/[^/]*:/i.test(text))return null;
    const host=url.hostname.toLowerCase().replace(/^www\./,'');const path=url.pathname;
    if(host==='youtube.com'||host==='m.youtube.com') {
      const id=path==='/watch'?url.searchParams.get('v'):path.match(/^\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{11})\/?$/)?.[1];
      return id&&/^[A-Za-z0-9_-]{11}$/.test(id)?'https://www.youtube.com/watch?v='+id:null;
    }
    if(host==='youtu.be'){const id=path.match(/^\/([A-Za-z0-9_-]{11})\/?$/)?.[1];return id?'https://www.youtube.com/watch?v='+id:null;}
    if(host==='vimeo.com'||host==='player.vimeo.com'){const id=path.match(/^\/(?:video\/)?([0-9]{1,20})\/?$/)?.[1];return id?'https://vimeo.com/'+id:null;}
    if(host==='facebook.com'||host==='m.facebook.com') {
      const id=path.match(/^\/(?:[^/]+\/videos|reel)\/([0-9]{1,30})\/?$/)?.[1]||(['/watch','/watch/'].includes(path)?url.searchParams.get('v'):null);
      return id&&/^[0-9]{1,30}$/.test(id)?'https://www.facebook.com/watch/?v='+id:null;
    }
    if(host==='tiktok.com'){const match=path.match(/^\/@([A-Za-z0-9_.]{1,64})\/video\/([0-9]{1,30})\/?$/);return match?'https://www.tiktok.com/@'+match[1]+'/video/'+match[2]:null;}
    if(host==='dailymotion.com'){const id=path.match(/^\/video\/([A-Za-z0-9]{1,30})\/?$/)?.[1];return id?'https://www.dailymotion.com/video/'+id:null;}
    if(host==='dai.ly'){const id=path.match(/^\/([A-Za-z0-9]{1,30})\/?$/)?.[1];return id?'https://www.dailymotion.com/video/'+id:null;}
  }catch {return null;}
  return null;
}

export function parsePublicVideoUrls(value: string): {urls: string[]; error?: 'count' | 'invalid'} {
  const supplied=[...new Set(value.split(/\r?\n/).map(url=>url.trim()).filter(Boolean))];
  if(supplied.length>3)return {urls:[],error:'count'};
  const urls:string[]=[];
  for(const text of supplied){const normalized=normalizePublicVideoUrl(text);if(!normalized)return {urls:[],error:'invalid'};if(!urls.includes(normalized))urls.push(normalized);}
  return {urls};
}
