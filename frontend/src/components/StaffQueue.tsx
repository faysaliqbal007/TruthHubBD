"use client";
import {useCallback,useEffect,useRef,useState} from 'react';
import {api} from '../services/api';
import {createRequestSequence,staffError,type StaffPagination} from './staffControlState';

export function useStaffQueue<T>(endpoint: string, enabled = true) {
  const requests = useRef(createRequestSequence());
  const [snapshot,setSnapshot] = useState<{endpoint:string;items:T[];pagination?:StaffPagination}>();
  const [state,setState] = useState<{endpoint:string;loading:boolean;error:string}>();
  const refresh = useCallback(async () => {
    if (!enabled) return;
    const ticket = requests.current.next();
    setState({endpoint,loading:true,error:''});
    try {
      const result = await api<{data:T[];pagination?:StaffPagination}>(endpoint);
      if (!requests.current.isCurrent(ticket)) return;
      setSnapshot({endpoint,items:result.data,pagination:result.pagination});
      setState({endpoint,loading:false,error:''});
    } catch (error) {
      if (requests.current.isCurrent(ticket)) setState({endpoint,loading:false,error:staffError(error)});
    }
  },[endpoint,enabled]);
  useEffect(() => { void refresh(); return () => { requests.current.next(); }; },[refresh]);
  const loading = enabled && (state?.endpoint !== endpoint || state.loading);
  const error = state?.endpoint === endpoint ? state.error : '';
  const visible = enabled && !loading && !error && snapshot?.endpoint === endpoint;
  return {items:visible?snapshot.items:[],pagination:visible?snapshot.pagination:undefined,loading,error,refresh};
}

export function StaffPaginationControls({pagination,page,onPage,disabled=false}:{pagination?:StaffPagination;page:number;onPage:(page:number)=>void;disabled?:boolean}) {
  if (!pagination) return null;
  return <nav className="workspace-tabs" aria-label="Queue pages"><button type="button" disabled={disabled||page<=1} onClick={()=>onPage(page-1)}>Previous</button><span role="status">{pagination.from??0}–{pagination.to??0} of {pagination.total} · Page {pagination.current_page} of {pagination.last_page}</span><button type="button" disabled={disabled||page>=pagination.last_page} onClick={()=>onPage(page+1)}>Next</button></nav>;
}
