import {Link} from 'react-router-dom';
import {ArrowRight, ArrowUp, Building2, ChevronRight, FileText, Flag, HelpCircle, PhoneCall, Shield, ShieldAlert, ShieldCheck, Sparkles} from 'lucide-react';
import {useEffect,useState} from 'react';
import {Logo} from './ui/Logo';
import {useAuth} from '../features/auth/AuthContext';
import {api} from '../services/api';
import './community-footer-organizations.css';

export function CommunityFooter({lang,onReview}:{lang:'en'|'bn';onReview:()=>void}){
 const bn=lang==='bn';
 const {user,checking}=useAuth();
 const accountId=user?.id;
 const [representation,setRepresentation]=useState<{userId:number;count:number}>();

 useEffect(()=>{
  if(checking||accountId==null)return;
  let active=true;
  api<{data:{id:number}[]}>('/business-center').then(result=>{if(active)setRepresentation({userId:accountId,count:result.data.length});}).catch(()=>{});
  return()=>{active=false;};
 },[checking,accountId]);

 const scrollToTop = () => {
   window.scrollTo({ top: 0, behavior: 'smooth' });
 };

 const hasRepresentation=!!user&&(user.role==='business'||Boolean(user.has_claimed_business)||(representation?.userId===user.id&&representation.count>0));
 const exportUrl=`${(process.env.NEXT_PUBLIC_API_URL??'').replace(/\/$/,'')}/api/directory-data`;

 return <footer className="community-footer organization-footer">
  {/* Organization Representatives Strip */}
  <section className="community-footer-business" aria-labelledby="footer-business-title">
   <div className="community-footer-width">
    <span className="footer-business-icon" aria-hidden="true"><Building2 size={30}/></span>
    <div>
      <span className="footer-eyebrow">{bn?'প্রতিষ্ঠানের প্রতিনিধিদের জন্য':'FOR ORGANIZATION REPRESENTATIVES'}</span>
      <h2 id="footer-business-title">{hasRepresentation?(bn?'আপনার প্রতিষ্ঠানকে এগিয়ে নিন।':'Keep your organization connected.'):(bn?'আপনার প্রতিষ্ঠান। আপনার উত্তর।':'Your organization. Your voice.')}</h2>
      <p>
        {hasRepresentation?(bn?'অনুমোদিত প্রোফাইল পরিচালনা করুন, তথ্য হালনাগাদ করুন এবং মানুষের অভিজ্ঞতার উত্তর দিন।':'Manage your approved profiles, keep details current, and respond to community experiences.'):(bn?'দোকান, হাসপাতাল, শিক্ষাপ্রতিষ্ঠান বা কর্মক্ষেত্রের প্রতিনিধি? বিদ্যমান প্রোফাইল খুঁজে প্রতিনিধিত্বের প্রমাণ দিন এবং মানুষের অভিজ্ঞতার উত্তর দিন।':'Represent a shop, hospital, school, or employer? Find its existing profile, confirm your authority, and respond to people’s experiences.')} 
        <span className="footer-claim-note">{bn?'প্রতিনিধিত্বের অনুমোদন সেবার মানের নিশ্চয়তা নয়।':'Representation approval is not a quality guarantee.'}</span>
      </p>
    </div>
    <div className="community-footer-actions">
      {!hasRepresentation && (
        <Link className="footer-outline-action footer-animated-btn" to="/claim">
          <Building2 size={18} aria-hidden="true"/>
          {bn ? 'প্রতিষ্ঠানের প্রতিনিধিত্ব দাবি করুন' : 'Claim your organization'}
          <ArrowRight size={18} aria-hidden="true"/>
        </Link>
      )}
      <Link className="footer-text-action footer-animated-btn" to="/business-center">
        {bn ? 'আপনার কেন্দ্র খুলুন' : 'Open your center'} →
      </Link>
    </div>
   </div>
  </section>

  {/* Civic Purpose & Citizen Action */}
  <section className="community-footer-purpose" aria-labelledby="footer-purpose-title">
   <div className="community-footer-width">
     <span className="footer-eyebrow">{bn?'সচেতন সিদ্ধান্ত। শক্তিশালী সমাজ।':'BETTER DECISIONS. STRONGER COMMUNITIES.'}</span>
     <h2 id="footer-purpose-title">{bn?'আপনার অভিজ্ঞতা পরের মানুষটিকে সাহায্য করুক।':'What you know can help the next person.'}</h2>
     <p>{bn?'সৎ অভিজ্ঞতা জানান। উদ্বেগ নিরাপদে রিপোর্ট করুন। প্রতিটি অভিযোগ পর্যালোচনা প্রয়োজন।':'Share a first-hand experience or send a concern safely. Reports need review; they are not findings of guilt.'}</p>
     <div className="community-footer-actions">
       <button type="button" className="footer-primary-action footer-animated-btn" onClick={onReview}>
         {bn?'রিভিউ লিখুন':'Write a review'}
         <ArrowRight size={18} aria-hidden="true"/>
       </button>
       <Link className="footer-admin-action footer-animated-btn" to="/report">
         <Flag size={18} aria-hidden="true"/>
         {bn?'অ্যাডমিনকে জানান':'Report to admin'}
       </Link>
     </div>
     <small>
       <ShieldCheck size={16} aria-hidden="true"/>
       {bn?'মূল প্রমাণ ব্যক্তিগত থাকে। এটি জরুরি সেবা নয়।':'Original evidence stays private. This is not an emergency service.'}
     </small>
   </div>
  </section>

  {/* Main Multi-Column Footer Base */}
  <div className="community-footer-base community-footer-width">
   <div className="community-footer-brand">
     <Logo/>
     <p>{bn?'বাংলাদেশের প্রতিষ্ঠান, মানুষের অভিজ্ঞতা ও পর্যালোচিত কেস আপডেট এক জায়গায়।':'Organizations, community experiences and reviewed case updates across Bangladesh.'}</p>
     <div className="footer-brand-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 12, fontWeight: 700, color: '#166534', marginTop: 10 }}>
       <ShieldCheck size={14} color="#16a34a" />
       {bn ? 'আইনসম্মত নাগরিক মধ্যস্থতাকারী' : 'Lawful Consumer Intermediary'}
     </div>
   </div>

   {/* Column 1: About & Help */}
   <nav aria-label={bn?'পরিচিতি ও সাহায্য':'About & Help'}>
     <h3>{bn?'পরিচিতি ও সাহায্য':'About & Help'}</h3>
     <Link to="/about" className="footer-link">{bn?'আমাদের সম্পর্কে':'About Us'}</Link>
     <Link to="/how-to-use" className="footer-link">{bn?'কীভাবে ব্যবহার করবেন':'How to Use'}</Link>
     <Link to="/business-center" className="footer-link">{bn?'প্রতিষ্ঠান ব্যবস্থাপনা কেন্দ্র':'Organization Center'}</Link>
     <Link to="/claim" className="footer-link">{bn?'মালিকানা দাবি করুন':'Claim Organization'}</Link>
     <Link to="/ads" className="footer-link">{bn?'বিজ্ঞাপন ও স্বচ্ছতা নীতি':'Advertising & Transparency'}</Link>
   </nav>

   {/* Column 2: Trust & Safety */}
   <nav aria-label={bn?'আস্থা, নিরাপত্তা ও আইন':'Trust & Safety'}>
     <h3>{bn?'আস্থা ও আইনি সুরক্ষা':'Trust & Safety'}</h3>
     <Link to="/trust-safety" className="footer-link">{bn?'আস্থা ও নিরাপত্তা নীতিমালা':'Trust & Safety Policy'}</Link>
     <Link to="/policies" className="footer-link">{bn?'গোপনীয়তা ও স্ট্যান্ডার্ডস':'Privacy & Standards'}</Link>
     <Link to="/scam-alerts" className="footer-link">{bn?'প্রতারণা সতর্কতা ও কেসবুক':'Scam Alerts & Cases'}</Link>
     <Link to="/report" className="footer-link">{bn?'অ্যাডমিনকে অভিযোগ পাঠান':'Report to Admin'}</Link>
     <Link to="/security" className="footer-link">{bn?'অ্যাকাউন্ট নিরাপত্তা':'Account Security'}</Link>
   </nav>

   {/* Column 3: Explore & Community */}
   <nav aria-label={bn?'খুঁজে দেখুন':'Explore'}>
     <h3>{bn?'অন্বেষণ ও সেবা':'Explore'}</h3>
     <Link to="/search?view=businesses" className="footer-link">{bn?'প্রতিষ্ঠান ও সেবা ডিরেক্টরি':'Organizations & Services'}</Link>
     <Link to="/search?view=reviews" className="footer-link">{bn?'নাগরিক রিভিউ ফিড':'Community Reviews'}</Link>
     <Link to="/scam-alerts?status=trending" className="footer-link">{bn?'ট্রেন্ডিং সতর্কতা নোটিশ':'Trending Alert Notices'}</Link>
     <Link to="/activity" className="footer-link">{bn?'আমার নাগরিক কার্যক্রম':'My Civic Activity'}</Link>
     <Link to="/notifications" className="footer-link">{bn?'বিজ্ঞপ্তি ইনবক্স':'Notification Inbox'}</Link>
   </nav>

   {/* Column 4: Helplines & Assistance */}
   <div className="community-footer-helplines">
     <h3 style={{ fontSize: 13, letterSpacing: '.06em', margin: '0 0 12px', textTransform: 'uppercase' }}>{bn?'জাতীয় জরুরি হেল্পলাইন':'National Helplines'}</h3>
     <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
       <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#991b1b', fontWeight: 700 }}>
         <PhoneCall size={14} />
         <span>{bn ? 'জাতীয় জরুরি সেবা: ৯৯৯' : 'National Emergency: 999'}</span>
       </div>
       <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#0f766e', fontWeight: 700 }}>
         <ShieldAlert size={14} />
         <span>{bn ? 'ভোক্তা অধিকার অধিদপ্তর: ১৬১২১' : 'Consumer Rights: 16121'}</span>
       </div>
       <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569' }}>
         <HelpCircle size={14} />
         <span>{bn ? 'সরকারি তথ্য ও সেবা: ৩৩৩' : 'Citizen Information: 333'}</span>
       </div>
       <button
         type="button"
         onClick={scrollToTop}
         className="footer-back-to-top"
         style={{
           display: 'inline-flex',
           alignItems: 'center',
           gap: 6,
           marginTop: 10,
           padding: '7px 14px',
           borderRadius: 8,
           border: '1px solid #cbd5e1',
           background: '#ffffff',
           color: '#1e293b',
           fontSize: 12.5,
           fontWeight: 700,
           cursor: 'pointer',
           width: 'fit-content'
         }}
       >
         <ArrowUp size={14} />
         {bn ? 'উপরে ফিরে যান' : 'Back to top'}
       </button>
     </div>
   </div>

   {/* Attribution & Legal Notice */}
   <div className="community-footer-attribution">
     <p>© {new Date().getFullYear()} TruthHubBD · {bn?'বাংলাদেশের জন্য নির্মিত স্বাধীন নাগরিক নেটওয়ার্ক':'Built for Bangladesh'}</p>
     <p>{bn?'ডিরেক্টরির তথ্য':'Directory data'}: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors · ODbL</a> · <a href={exportUrl}>{bn?'উৎসসহ ডেটা ডাউনলোড':'Download attributed data'}</a></p>
     <p>{bn?'মালিকানা অনুমোদন সেবার মানের নিশ্চয়তা নয়। বিজ্ঞাপন আলাদাভাবে চিহ্নিত। ট্রুথহাববিডি কোনো রায় দেয় না; এটি নাগরিকদের প্রত্যক্ষ অভিজ্ঞতার রেকর্ড।':'Ownership approval is not a quality guarantee. Advertisements are labelled separately.'}</p>
   </div>
  </div>
 </footer>;
}
