export type AttachmentLike={name:string;size:number;type:string;lastModified:number};
export const MAX_ATTACHMENT_TOTAL_MB=35;
/** Reject the entire new selection without discarding files already selected. */
export function selectAttachments<T extends AttachmentLike>(existing:T[],picked:T[],maxFiles=20,maxMB=10):{files:T[];error:string}{
 maxFiles=Math.min(20,Math.max(1,maxFiles));
 const unique:T[]=[];
 for(const file of picked)if(![...existing,...unique].some(old=>old.name===file.name&&old.size===file.size&&old.lastModified===file.lastModified))unique.push(file);
 if(existing.length+unique.length>maxFiles)return {files:existing,error:`You can attach up to ${maxFiles} files. Remove one before adding more.`};
 const isSupported = (f: T) => f.type.startsWith('image/') || f.type === 'application/pdf' || /\.(jpe?g|png|webp|gif|svg|avif|bmp|pdf)$/i.test(f.name);
 if(unique.some(file=>!isSupported(file)||file.size===0||file.size>maxMB*1024*1024))return {files:existing,error:`Choose non-empty image or PDF files, up to ${maxMB} MB each. Your existing selections have been kept.`};
 if([...existing,...unique].reduce((total,file)=>total+file.size,0)>MAX_ATTACHMENT_TOTAL_MB*1024*1024)return {files:existing,error:`Total attachment size must not exceed ${MAX_ATTACHMENT_TOTAL_MB} MB. Your existing selections have been kept.`};
 return {files:[...existing,...unique],error:''};
}
