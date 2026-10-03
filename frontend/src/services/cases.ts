import {useEffect,useState} from 'react';
import {api} from './api';
import type {LinkedReview,PublicContentTranslations,PublicMediaItem,ScamAlert} from '../types';
export type PublicCase={admin_reviewed?:boolean;alert_enabled?:boolean;alert_requested?:boolean;public_video_urls?:string[];video_accessibility?:'not_verified';linked_review?:LinkedReview|null;translations?:PublicContentTranslations;public_media?:PublicMediaItem[];is_demo?:boolean;events?:{status:string;summary:string;created_at:string}[];id:number;case_code:string;title:string;summary:string;status:string;published_at:string;resolved_at?:string;created_at?:string;amount?:string|number;incident_type?:string;incident_date?:string;subject_response?:string|null;resolution_note?:string|null;reporter_user_id?:number;business:{id?:number;name:string;slug:string;category:string;location?:string;user_id?:number|null;verified?:boolean;image?:string|null}};
type CasePage={data:PublicCase[];total:number;last_page:number};
const statuses:Record<string,string>={'Trending':'trending','Published':'published','Resolved':'resolved','Business Responded':'disputed','Under Review':'under_review'};
export function useCases(caseCode?:string,query='',status='All cases',page=1,period='all',sort='newest',location='',category='All',businessSlug?:string,incidentType='all'){
 const[attempt,setAttempt]=useState(0);
 const requestKey=JSON.stringify([caseCode,query,status,page,period,sort,location,category,businessSlug,incidentType,attempt]);
 const[snapshot,setSnapshot]=useState<{key:string;cases:(ScamAlert & {caseCode:string;title:string;rawStatus?:string;incident_type?:string;subject_response?:string|null;resolution_note?:string|null;reporter_user_id?:number;business_user_id?:number|null;business_id?:number;resolved_at?:string;created_at?:string})[];total:number;lastPage:number;error:string}>();
 useEffect(()=>{
  let active=true;
  const timer=setTimeout(()=>{
   const params=new URLSearchParams({page:String(page),period,sort});
   if(query.trim())params.set('q',query.trim());
   if(statuses[status])params.set('status',statuses[status]);
   if(incidentType && incidentType !== 'all')params.set('incident_type',incidentType);
   if(location)params.set('location',location);
   if(category!=='All')params.set('category',category);
   api<{data:CasePage|PublicCase}>(businessSlug?`/businesses/${encodeURIComponent(businessSlug)}/scam-cases?${params}`:caseCode?`/scam-cases/${encodeURIComponent(caseCode)}`:`/scam-cases?${params}`)
    .then(r=>{
     if(!active)return;
     const paginated='data' in r.data;
     const records=paginated?(r.data as CasePage).data:[r.data as PublicCase];
     const cases=records.map(c=>({id:c.id,caseCode:c.case_code,slug:c.case_code,title:c.title,entity:c.business.name,businessSlug:c.business.slug,businessImage:c.business?.image||null,category:c.business.category,summary:c.summary,
      status:(c.status==='published'?'Published':c.status==='resolved'?'Resolved':c.status==='disputed'?'Business Responded':'Under Review') as ScamAlert['status'],
      rawStatus:c.status,
      incident_type:c.incident_type,
      incidentType:c.incident_type,
      date:c.published_at?.slice(0,10)||c.created_at?.slice(0,10)||'Date not supplied',
      amount:c.amount ? `৳ ${Number(c.amount).toLocaleString('en-BD')}` : 'Not publicly disclosed',
      location:c.business.location||'Location not supplied',
      evidence:'Citizen report details and evidence securely retained.',
      response:c.status==='disputed'||Boolean(c.subject_response),
      subject_response:c.subject_response,
      resolution_note:c.resolution_note,
      reporter_user_id:c.reporter_user_id,
      business_user_id:c.business?.user_id,
      business_id:c.business?.id,
      resolved_at:c.resolved_at,
      created_at:c.created_at,
      public_media:c.public_media||[],is_demo:c.is_demo===true,adminReviewed:c.admin_reviewed===true,alertEnabled:c.alert_enabled===true,alertRequested:(c as any).alert_requested===true,alert_requested:(c as any).alert_requested===true,
      public_video_urls:c.public_video_urls||[],video_accessibility:c.video_accessibility||'not_verified',linked_review:c.linked_review||null,
      translations:c.translations||{},
      timeline:(c.events||[]).map(event=>({date:event.created_at,title:event.status.replaceAll('_',' '),desc:event.summary||'Status updated',done:true}))
     }));
     setSnapshot({key:requestKey,cases,total:paginated?(r.data as CasePage).total:records.length,lastPage:paginated?(r.data as CasePage).last_page:1,error:''});
    }).catch(e=>{if(active)setSnapshot({key:requestKey,cases:[],total:0,lastPage:1,error:e instanceof Error?e.message:'Unable to load public cases. Please retry.'});});
  },250);
  return()=>{active=false;clearTimeout(timer);};
 },[caseCode,query,status,page,period,sort,location,category,businessSlug,incidentType,requestKey]);
 const current=snapshot?.key===requestKey?snapshot:undefined;
 const cases=current?.cases??[];
 return{cases,loading:!current,error:current?.error??'',total:current?.total??0,lastPage:current?.lastPage??1,demo:cases.some(c=>c.is_demo),retry:()=>setAttempt(n=>n+1)};
}

export function useBusinessCases(slug:string,page=1){
 return useCases(undefined,'','All cases',page,'all','newest','','All',slug);
}
