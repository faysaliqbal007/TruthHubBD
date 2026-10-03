"use client";
import {useEffect,useRef,useState} from 'react';
import {api,apiFileUrl} from '../services/api';
import {Download,LockKeyhole} from 'lucide-react';
import {createRequestSequence,staffError} from './staffControlState';

type Attachment={index:number;type:string};
export function ReviewEvidenceDesk(){
 const[id,setId]=useState('');const[snapshot,setSnapshot]=useState<{id:string;files:Attachment[]}>();
 const[message,setMessage]=useState('');const[busy,setBusy]=useState(false);
 const requests=useRef(createRequestSequence());const active=useRef(0);
 useEffect(()=>()=>{requests.current.next();},[]);
 const current=snapshot?.id===id?snapshot:undefined;
 async function load(){
  if(active.current)return;const reviewId=id;const ticket=requests.current.next();active.current=ticket;
  setBusy(true);setMessage('');setSnapshot(undefined);
  try{const result=await api<{data:Attachment[]}>(`/moderation/reviews/${reviewId}/attachments`);if(requests.current.isCurrent(ticket))setSnapshot({id:reviewId,files:result.data});}
  catch(error){if(requests.current.isCurrent(ticket))setMessage(staffError(error));}
  finally{if(requests.current.isCurrent(ticket)){active.current=0;setBusy(false);}}
 }
 async function download(file:Attachment){
  if(active.current||!current)return;const reviewId=current.id;const ticket=requests.current.next();active.current=ticket;setBusy(true);setMessage('');
  try{
   const response=await fetch(apiFileUrl(`/moderation/reviews/${reviewId}/attachments/${file.index}`),{credentials:'include',headers:{Accept:'application/octet-stream'}});
   if(!response.ok){const result=await response.json().catch(()=>({message:'Download failed. Please try again.'}));throw new Error(result.message);}
   const blob=await response.blob();if(!requests.current.isCurrent(ticket))return;
   const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;
   link.download=`review-${reviewId}-attachment-${file.index+1}.${file.type==='application/pdf'?'pdf':file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg'}`;
   link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage('Private download ready. Access recorded.');
  }catch(error){if(requests.current.isCurrent(ticket))setMessage(staffError(error));}
  finally{if(requests.current.isCurrent(ticket)){active.current=0;setBusy(false);}}
 }
 return <details className="workspace-card"><summary>Review private attachments</summary><p>Authorized staff only. Downloads are scanned again and recorded in the audit history.</p><form className="review-form-content" aria-busy={busy} onSubmit={e=>{e.preventDefault();void load();}}><label>Review ID<input className="review-input" type="number" min="1" required value={id} onChange={e=>{requests.current.next();active.current=0;setBusy(false);setId(e.target.value);setSnapshot(undefined);setMessage('');}}/></label><button className="btn-pill-light" disabled={busy}>{busy?'Checking…':'View available attachments'}</button></form>{current&&!current.files.length&&<p>No private attachments for review #{current.id}.</p>}<div className="workspace-tabs">{current?.files.map(file=><button className="btn-pill-light" key={`${current.id}-${file.index}`} disabled={busy} onClick={()=>void download(file)}><LockKeyhole size={15}/><Download size={15}/> Review #{current.id} · Attachment {file.index+1} · {file.type.split('/')[1]}</button>)}</div><p role="status">{message}</p></details>;
}
