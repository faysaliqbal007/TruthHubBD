"use client";
import React,{useState} from 'react';
import {api} from '../services/api';
import {AppealForm} from './AdminTools';

export function CaseFollowup({id,subject=false}:{id:number;subject?:boolean}){
 const[message,setMessage]=useState('');const[busy,setBusy]=useState(false);
 return <div><details><summary>{subject?'Respond to this case':'Send additional private evidence'}</summary><form onSubmit={async e=>{e.preventDefault();const data=new FormData(e.currentTarget);setBusy(true);try{const r=await api<{message:string}>(`/scam-cases/${id}/${subject?'subject-response':'evidence'}`,'POST',subject?{subject_response:data.get('subject_response')}:data);setMessage(r.message);}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}}>{subject?<label>Your response (private until reviewed)<textarea className="review-textarea" name="subject_response" required maxLength={5000}/></label>:<label>Evidence files (up to five; PDF or images)<input name="evidence[]" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" multiple required/></label>}<button className="btn-pill-light" disabled={busy}>Send to moderation</button><p role="status">{message}</p></form></details><AppealForm caseId={id}/></div>;
}
