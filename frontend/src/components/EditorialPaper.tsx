"use client";
import {useRef} from 'react';
import {FileText,LockKeyhole,MapPin} from 'lucide-react';
export function EditorialPaper(){
 const sheet=useRef<HTMLDivElement>(null);
 return <div className="editorial-art" aria-hidden="true" onPointerMove={e=>{
  if(!sheet.current||!matchMedia('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)').matches)return;
  const r=e.currentTarget.getBoundingClientRect();sheet.current.style.transform=`rotateX(${-(e.clientY-r.top-r.height/2)/40}deg) rotateY(${(e.clientX-r.left-r.width/2)/40}deg)`;
 }} onPointerLeave={()=>{if(sheet.current)sheet.current.style.transform='';}}>
 <div className="paper-scene" ref={sheet}><div className="paper-back"/><div className="paper-front"><span className="paper-ribbon"/><span className="paper-kicker">THE NATIONAL RECORD</span><FileText size={30}/><strong>Every experience.<br/>A clearer picture.</strong><i/><i/><i/><span className="paper-note">Document · Review · Follow through</span></div><div className="paper-glass-note"><LockKeyhole size={18}/><span>Private evidence.<br/><strong>Thoughtful review.</strong></span></div><div className="paper-location"><MapPin size={16}/> Made for Bangladesh</div></div>
 </div>;
}
