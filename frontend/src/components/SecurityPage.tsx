"use client";
import {useCallback,useEffect,useRef,useState,type FormEvent} from 'react';
import {Link} from 'react-router-dom';
import {api} from '../services/api';
import {createActionLock,staffError} from './staffControlState';

export function SecurityPage(){
 const[enabled,setEnabled]=useState(false);const[secret,setSecret]=useState('');const[message,setMessage]=useState('');const[codes,setCodes]=useState<string[]>([]);
 const[loaded,setLoaded]=useState(false);const[loading,setLoading]=useState(true);const[busy,setBusy]=useState(false);const[error,setError]=useState('');
 const lock=useRef(createActionLock());const request=useRef(0);
 const load=useCallback(async()=>{const ticket=++request.current;setLoading(true);setError('');try{const r=await api<{enabled:boolean;verified:boolean}>('/security/status');if(ticket!==request.current)return;setEnabled(r.enabled);setMessage(r.verified?'Your staff session is verified.':'');setLoaded(true);}catch(e){if(ticket===request.current)setError(staffError(e));}finally{if(ticket===request.current)setLoading(false);}},[]);
 useEffect(()=>{void load();return()=>{request.current++;};},[load]);
 async function submit(event:FormEvent<HTMLFormElement>,kind:'enroll'|'verify'){
  event.preventDefault();if(!loaded||loading||!lock.current.enter())return;
  const form=event.currentTarget;const data=new FormData(form);setBusy(true);setError('');setMessage('');
  try{
   if(kind==='enroll'){const r=await api<{secret:string}>('/security/enroll','POST',{password:data.get('password')});setSecret(r.secret);}
   else{const r=await api<{message:string;recovery_codes?:string[]}>('/security/verify','POST',{code:data.get('code')});setMessage(r.message);setCodes(r.recovery_codes??[]);setEnabled(true);setSecret('');}
   form.reset();
  }catch(e){setError(staffError(e));}finally{lock.current.release();setBusy(false);}
 }
 return <div className="workspace-page"><div className="workspace-heading"><h1>Account security</h1><p>Authenticator protection for moderator and admin workspaces.</p></div><section className="workspace-card" aria-busy={loading||busy}>{loading&&<p role="status">Checking account security…</p>}{error&&<p role="alert" className="workspace-notice">{error}</p>}{!loaded&&!loading&&<button className="btn-pill-light" onClick={()=>void load()}>Retry security status</button>}{message&&<p role="status" className="workspace-notice">{message}</p>}{loaded&&!loading&&!enabled&&!secret&&<form className="review-form-content" onSubmit={e=>void submit(e,'enroll')}><label>Confirm your password<input className="review-input" name="password" type="password" required disabled={busy} autoComplete="current-password"/></label><button className="btn-teal-pill" disabled={busy}>{busy?'Setting up…':'Set up authenticator'}</button></form>}{secret&&<div><h2>Add to your authenticator app</h2><p>Choose “enter a setup key”, name the account TruthHubBD, and use a time-based code.</p><code style={{display:'block',overflowWrap:'anywhere',padding:16,background:'#edf8f5'}}>{secret}</code><p>This key is displayed only for enrollment. Keep it private.</p></div>}{loaded&&(enabled||secret)&&<form className="review-form-content" onSubmit={e=>void submit(e,'verify')}><label>Authenticator or recovery code<input className="review-input" name="code" required disabled={busy} autoComplete="one-time-code"/></label><button className="btn-teal-pill" disabled={busy}>{busy?'Verifying…':'Verify session'}</button></form>}{codes.length>0&&<section><h2>Save your recovery codes</h2><p>These codes are shown once. Each can be used once if you lose your authenticator.</p>{codes.map(c=><code style={{display:'block'}} key={c}>{c}</code>)}</section>}<p><Link to="/admin">Open staff workspace →</Link></p></section></div>;
}
