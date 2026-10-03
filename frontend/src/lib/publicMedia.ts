export type PublicGalleryItem = {url:string;alt:string;kind?:string;caption?:string};
export const AI_DEMO_ILLUSTRATION='/demo-media/community-shop-ai-v1.png';
const demoImages=new Set(['/demo-media/delivery.svg','/demo-media/parcel.svg','/demo-media/receipt.svg','/demo-media/service.svg',AI_DEMO_ILLUSTRATION]);

function publicPath(value:string):string|null {
 if(value.startsWith('/')&&!value.startsWith('//'))return value;
 try {
  const url = new URL(value);
  const apiOrigin = process.env.NEXT_PUBLIC_API_URL ? new URL(process.env.NEXT_PUBLIC_API_URL).origin : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000');
  const frontendOrigin=typeof window==='undefined'?null:window.location.origin;
  const rawPath=value.match(/^https?:\/\/[^/]+(\/[^?#]*)$/i)?.[1];
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash||rawPath!==url.pathname)return null;
  if(url.origin!==apiOrigin&&url.origin!==frontendOrigin)return null;
  return url.pathname;
 }catch{return null;}
}

/** API approvals and is_demo gating remain authoritative; the client never loads arbitrary media URLs. */
export function visiblePublicMedia(media:PublicGalleryItem[]):PublicGalleryItem[] {
 if(!Array.isArray(media))return [];
 return media.slice(0,20).filter(item=>{
  if(!item||typeof item.url!=='string'||typeof item.alt!=='string'||!item.alt.trim()||item.alt.length>300)return false;
  const path=publicPath(item.url);
  if(!path)return false;
  if(item.kind==='illustration')return demoImages.has(path);
  return (item.kind==='photo'||!item.kind)&&/^\/(?:public-media|storage\/scam-media)\/[a-z0-9][a-z0-9_.-]*\.(?:jpg|jpeg|png|webp)$/i.test(path);
 });
}

export function isAiDemoIllustration(item:PublicGalleryItem):boolean {
 return item.kind==='illustration'&&publicPath(item.url)===AI_DEMO_ILLUSTRATION;
}
