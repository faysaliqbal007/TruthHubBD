import {Flag} from 'lucide-react';
import {Link} from 'react-router-dom';
import {useAuth} from '../../features/auth/AuthContext';
import '../civic-community.css';

export type ReportContentLinkProps = {type: 'review' | 'scam_case' | 'business' | 'comment' | 'advertisement'; id: number; lang?: 'en' | 'bn'; className?: string; iconOnly?: boolean};
export function ReportContentLink({type, id, lang = 'en', className = '', iconOnly = false}: ReportContentLinkProps) {
  const {user}=useAuth();
  const reportPath=`/report?${new URLSearchParams({type,id:String(id)})}`;
  const label=user?(lang==='bn'?'রিপোর্ট করুন':'Report'):(lang==='bn'?'রিপোর্ট করতে লগ ইন করুন':'Sign in to report');
  return <Link className={`report-content-link ${className}`} aria-label={iconOnly?label:undefined} title={iconOnly?label:undefined} to={user?reportPath:'/login?next='+encodeURIComponent(reportPath)}><Flag size={14} aria-hidden="true"/>{!iconOnly&&<span>{label}</span>}</Link>;
}
