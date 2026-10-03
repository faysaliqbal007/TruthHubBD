import {useEffect, useState} from 'react';
import {api} from './api';

export type CommunityCounts = {directory_listings: number; imported_listings: number; community_listings: number; demo_listings: number; public_cases: number; demo_cases: number};
export type DivisionOverview = CommunityCounts & {key: string; name: string; name_bn: string; location_filter: string};
export type CommunityOverview = {divisions: DivisionOverview[]; totals: CommunityCounts; unknown_location: CommunityCounts; updated_at: string};

export function useCommunityOverview() {
  const [snapshot, setSnapshot] = useState<{attempt:number;overview:CommunityOverview|null;error:string}>();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    api<{success: boolean; data: CommunityOverview}>('/community-overview').then(result => {
      if (active) setSnapshot({attempt,overview:result.data,error:''});
    }).catch(reason => {
      if (active) setSnapshot({attempt,overview:null,error:reason instanceof Error ? reason.message : 'Community overview is unavailable.'});
    });
    return () => { active = false; };
  }, [attempt]);
  const current=snapshot?.attempt===attempt?snapshot:undefined;
  return {overview:current?.overview??null, loading:!current, error:current?.error??'', retry: () => setAttempt(value => value + 1)};
}
