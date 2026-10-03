"use client";
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {Link} from 'react-router-dom';
import {MessageCircle,Send,CornerDownRight} from 'lucide-react';
import {api} from '../../services/api';
import {useAuth} from '../../features/auth/AuthContext';
import {ReportContentLink} from './ReportContentLink';
import {useI18n} from '../../i18n/LanguageContext';
import {formatNumber,formatDate,localizedError} from '../../i18n/dictionary';
import {publicText,originalTextLabel,type PublicTranslations} from '../../i18n/content';
import '../content-report.css';
import './threaded-comments.css';
type Comment={id:number;author:string;avatar_url?:string|null;body:string;parent_id:number|null;created_at:string;translations?:PublicTranslations;is_organization?:boolean;badge?:string|null};
export function ThreadedComments({title,reviewId,compact=false,hideHeader=false,onCountChange}:{title?:string;reviewId?:number|string;compact?:boolean;hideHeader?:boolean;onCountChange?:(count:number)=>void}){
 const {lang,t}=useI18n();const displayTitle=title||t('Community discussion','কমিউনিটির আলোচনা');
 const{user}=useAuth();const[comments,setComments]=useState<Comment[]>([]);const[text,setText]=useState('');const[parent,setParent]=useState<number|null>(null);const[busy,setBusy]=useState(false);const[loading,setLoading]=useState(false);const[error,setError]=useState('');const[attempt,setAttempt]=useState(0);
 const countCallback=useRef(onCountChange);
 useEffect(()=>{countCallback.current=onCountChange;},[onCountChange]);
 useEffect(()=>{setComments([]);setText('');setParent(null);setError('');},[reviewId]);
 useEffect(()=>{if(!reviewId)return;let active=true;setLoading(true);api<{data:{comments:Comment[]}}>(`/reviews/${reviewId}`).then(r=>{if(active){setComments(r.data.comments);countCallback.current?.(r.data.comments.length);setError('');}}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[reviewId,attempt]);
 const send=async()=>{if(!user||!reviewId||!text.trim()||busy)return;setBusy(true);setError('');try{await api(`/reviews/${reviewId}/comments`,'POST',{body:text.trim(),parent_id:parent});setText('');setParent(null);setAttempt(n=>n+1);}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
 if(!reviewId)return <section className="threaded-comments-box paper-discussion"><h3>{t('Follow this case','ঘটনার আপডেট দেখুন')}</h3><p>{t('Public updates appear in the case timeline. Submit additional private evidence or a response through your activity workspace; do not post personal documents publicly.','ঘটনার সময়রেখায় প্রকাশ্য আপডেট দেখুন। আরও ব্যক্তিগত প্রমাণ বা উত্তর আমার কার্যক্রম থেকে পাঠান; ব্যক্তিগত নথি প্রকাশ্যে দেবেন না।')}</p><Link to="/activity" className="btn-pill-light">{t('Open my activity','আমার কার্যক্রম খুলুন')}</Link></section>;
 const commentIds=new Set(comments.map(comment=>comment.id));
 const replyTarget=comments.find(comment=>comment.id===parent);
 const node=(c:Comment,nested=false,ancestorIds=new Set<number>()):ReactNode=>{
  if(ancestorIds.has(c.id))return null;
  const path=new Set(ancestorIds);path.add(c.id);
  const replies=comments.filter(reply=>reply.parent_id===c.id);
  const original=originalTextLabel(c,lang,['body']);
  return <div key={c.id} className="threaded-item-block"><article className={nested?'threaded-reply-item':'threaded-comment-node'}><span className="threaded-user-avatar" aria-hidden="true" style={{ overflow: 'hidden', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...(c.is_organization ? { background: '#0f766e', color: '#ffffff', fontWeight: 800 } : {}) }}>{c.avatar_url ? <img src={c.avatar_url.startsWith('http') ? c.avatar_url : (c.avatar_url.startsWith('/') ? c.avatar_url : '/' + c.avatar_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }} /> : c.author.slice(0,2).toUpperCase()}</span><div className="threaded-node-body"><div className="threaded-author-bar"><strong className="threaded-name" style={c.is_organization ? { color: '#0f766e', display: 'inline-flex', alignItems: 'center', gap: 6 } : undefined}>{c.author}{c.is_organization && <span style={{ fontSize: 10, background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>{t('Official Organization', 'অফিসিয়াল প্রতিষ্ঠান')}</span>}</strong><time dateTime={c.created_at}>{formatDate(c.created_at,lang)}</time></div><div className="threaded-bubble">{original&&<small className="content-review-date">{original}</small>}<p className="threaded-text">{publicText(c,'body',lang)}</p></div><div className="threaded-actions-row">{user&&<button type="button" className="threaded-action-btn" onClick={()=>{setParent(c.parent_id||c.id);document.getElementById(`discussion-${reviewId}`)?.focus();}}>{t('Reply','উত্তর দিন')}</button>}<ReportContentLink type="comment" id={c.id} lang={lang}/></div></div></article>{replies.length>0&&<div className="threaded-replies-tray">{replies.map(reply=>node(reply,true,path))}</div>}</div>;
 };
 return <section className={`threaded-comments-box paper-discussion ${compact?'compact':''}`} aria-label={displayTitle} aria-busy={loading}>
  {!hideHeader&&<div className="threaded-comments-top"><div className="threaded-comments-title-group"><MessageCircle size={20} aria-hidden="true"/><h3>{displayTitle}</h3><span className="threaded-count-pill">{formatNumber(comments.length,lang)} {t('comments','মন্তব্য')}</span></div></div>}
  {error&&<p role="alert" className="workspace-notice">{localizedError(error,lang)} <button className="btn-pill-light" onClick={()=>setAttempt(n=>n+1)}>{t('Retry','আবার চেষ্টা করুন')}</button></p>}
  {loading&&<p role="status">{t('Loading discussion…','আলোচনা লোড হচ্ছে…')}</p>}
  {!loading&&!error&&!comments.length&&<p>{t('Be the first to ask a helpful question or share a factual follow-up.','একটি সহায়ক প্রশ্ন বা তথ্যভিত্তিক আপডেট দিয়ে আলোচনা শুরু করুন।')}</p>}
  <div className="threaded-comments-feed">{comments.filter(c=>!c.parent_id||!commentIds.has(c.parent_id)).map(c=>node(c))}</div>
  {user?<form className="threaded-new-form" onSubmit={e=>{e.preventDefault();void send();}} aria-busy={busy}><div className="threaded-input-col">{parent&&<p className="threaded-reply-context"><CornerDownRight size={16} aria-hidden="true"/>{t('Replying to','উত্তর দিচ্ছেন:')} {replyTarget?.author||t('this thread','এই আলোচনা')} <button type="button" className="threaded-action-btn" onClick={()=>setParent(null)}>{t('Cancel','বাতিল')}</button></p>}<label htmlFor={`discussion-${reviewId}`}>{parent?t('Your reply','আপনার উত্তর'):t('Join the discussion','আলোচনায় যোগ দিন')}</label><textarea id={`discussion-${reviewId}`} className="threaded-input-area" rows={3} maxLength={3000} required value={text} onChange={e=>setText(e.target.value)} aria-describedby={`discussion-help-${reviewId}`} placeholder={t('Ask a helpful question or share a factual follow-up.','সহায়ক প্রশ্ন করুন বা তথ্যভিত্তিক আপডেট লিখুন।')}/><p id={`discussion-help-${reviewId}`} className="threaded-input-help">{t('Keep private evidence and personal identifiers out of public comments.','প্রকাশ্য মন্তব্যে ব্যক্তিগত প্রমাণ বা কারও পরিচয়সংক্রান্ত তথ্য দেবেন না।')}</p><div className="threaded-form-foot"><small>{formatNumber(text.length,lang)}/{formatNumber(3000,lang)}</small><button type="submit" className="threaded-submit-btn" disabled={busy||!text.trim()}><Send size={16} aria-hidden="true"/>{busy?t('Sending…','পাঠানো হচ্ছে…'):parent?t('Post reply','উত্তর পাঠান'):t('Post comment','মন্তব্য পাঠান')}</button></div></div></form>:<p className="threaded-sign-in"><Link to={'/login?next='+encodeURIComponent(`/reviews/${reviewId}#discussion`)}>{t('Sign in','সাইন ইন করুন')}</Link> {t('to join this discussion.','এই আলোচনায় যোগ দিতে।')}</p>}
 </section>;
}
