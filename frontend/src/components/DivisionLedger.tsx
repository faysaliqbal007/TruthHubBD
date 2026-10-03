"use client";
import {ArrowUpRight, ChevronDown, MapPin, RefreshCw} from 'lucide-react';
import {Link} from 'react-router-dom';
import {useEffect, useRef} from 'react';
import {useCommunityOverview} from '../services/communityOverview';
import './civic-community.css';

const divisions = [
  ['dhaka', 'Dhaka', 'ঢাকা'], ['chattogram', 'Chattogram', 'চট্টগ্রাম'], ['rajshahi', 'Rajshahi', 'রাজশাহী'], ['khulna', 'Khulna', 'খুলনা'],
  ['barishal', 'Barishal', 'বরিশাল'], ['sylhet', 'Sylhet', 'সিলেট'], ['rangpur', 'Rangpur', 'রংপুর'], ['mymensingh', 'Mymensingh', 'ময়মনসিংহ'],
] as const;

export function DivisionLedger({lang = 'en'}: {lang?: 'en' | 'bn'}) {
  const bn = lang === 'bn';
  const divisionDetails = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 901px)');
    const update = () => {if (divisionDetails.current) divisionDetails.current.open = desktop.matches;};
    update();
    desktop.addEventListener('change', update);
    return () => desktop.removeEventListener('change', update);
  }, []);
  const {overview, loading, error, retry} = useCommunityOverview();
  const number = (value: number) => value.toLocaleString(bn ? 'bn-BD' : 'en-GB');
  const listingCount = (record: {directory_listings: number; demo_listings: number}) => record.directory_listings - (record.demo_listings ?? 0);
  const maxListings = Math.max(1, ...(overview?.divisions.map(listingCount) || []));
  const totals = overview?.totals;
  return <aside className="division-ledger" aria-label={bn ? 'বিভাগভিত্তিক কমিউনিটি তথ্য' : 'Community overview by division'}>
    <div className="division-ledger-heading"><span className="division-ledger-mark" aria-hidden="true"><MapPin size={21}/></span><span className="civic-kicker">{bn ? 'বাংলাদেশ, এক নজরে' : 'ACROSS BANGLADESH'}</span><span className="division-ledger-edition">BD / 08</span></div>
    <h2>{bn ? 'আট বিভাগ।' : 'Eight divisions.'}<br/><em>{bn ? 'এক কমিউনিটি।' : 'One community.'}</em></h2>
    <p className="division-ledger-intro">{bn ? 'আপনার এলাকার প্রতিষ্ঠান ও প্রকাশ্য কেস আপডেট খুঁজুন।' : 'A local starting point for everyday decisions.'}</p>
    <div className="division-ledger-totals" aria-busy={loading}><div><strong>{totals ? number(listingCount(totals)) : '—'}</strong><span>{bn ? 'প্রতিষ্ঠানের তালিকা' : 'directory listings'}</span></div><div><strong>{totals ? number(totals.public_cases) : '—'}</strong><span>{bn ? 'প্রকাশ্য কেস' : 'public case updates'}</span></div></div>
    <details className="division-ledger-details" ref={divisionDetails}>
      <summary><span>{bn ? '৮ বিভাগের তথ্য দেখুন' : 'Explore all 8 divisions'}</span><ChevronDown size={18} aria-hidden="true"/></summary>
      <div className="division-ledger-table">
        <div className="division-ledger-columns"><span>{bn ? 'বিভাগ' : 'DIVISION'}</span><span>{bn ? 'তালিকা' : 'LISTINGS'}</span><span>{bn ? 'আপডেট' : 'UPDATES'}</span></div>
        {divisions.map(([key, name, nameBn], position) => {
          const row = overview?.divisions.find(division => division.key === key);
          const filter = row?.location_filter || `${name} Division`;
          const listings = row ? listingCount(row) : undefined;
          return <div className="division-ledger-row" key={key}>
            <Link className="division-ledger-name" to={`/search?${new URLSearchParams({view:'businesses',location: filter})}`}><span className="division-ledger-index">{bn ? number(position+1) : String(position + 1).padStart(2, '0')}</span><span>{bn ? (row?.name_bn || nameBn) : (row?.name || name)}</span><ArrowUpRight size={13} aria-hidden="true"/></Link>
            <span className="division-ledger-count">{listings === undefined ? '—' : number(listings)}<span className="division-ledger-bar" aria-hidden="true"><span style={{width: `${listings === undefined ? 0 : listings / maxListings * 100}%`}}/></span></span>
            <Link className="division-ledger-cases" aria-label={`${bn ? nameBn : name}: ${bn ? 'প্রকাশ্য কেস দেখুন' : 'read public case updates'}`} to={`/scam-alerts?${new URLSearchParams({location: filter})}`}><span>{row ? number(row.public_cases) : '—'}</span></Link>
          </div>;
        })}
      </div>
    </details>
    {loading && <p className="division-ledger-status" role="status">{bn ? 'বর্তমান তথ্য লোড হচ্ছে…' : 'Loading current directory counts…'}</p>}
    {error && <div className="division-ledger-status" role="status"><p>{bn ? 'এই মুহূর্তে পরিসংখ্যান পাওয়া যাচ্ছে না। বিভাগ থেকে খুঁজতে পারেন।' : 'Counts are unavailable. You can still browse by division.'}</p><button type="button" onClick={retry}><RefreshCw size={14} aria-hidden="true"/>{bn ? 'আবার চেষ্টা করুন' : 'Retry counts'}</button></div>}
    <p className="division-ledger-note">{bn ? 'আমদানি করা ও কমিউনিটির যোগ করা তালিকা।' : 'Imported & community directory records.'}{overview && listingCount(overview.unknown_location) > 0 && <span>{bn ? `${number(listingCount(overview.unknown_location))}টি তালিকায় বিভাগ দেওয়া নেই।` : `${number(listingCount(overview.unknown_location))} listings have no division recorded.`}</span>}</p>
    <span className="division-ledger-footnote">{bn ? 'পরিসংখ্যান কোনো প্রতিষ্ঠানের মানের নিশ্চয়তা নয়।' : 'A directory listing is not an endorsement.'}</span>
  </aside>;
}
