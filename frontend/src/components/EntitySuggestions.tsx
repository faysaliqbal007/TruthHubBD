"use client";
import {useEffect,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {businessService} from '../services/businessService';
import type {Business} from '../types';
import {useI18n} from '../i18n/LanguageContext';
import {translateCategory} from '../i18n/dictionary';
export function EntitySuggestions({query,category,location}:{query:string;category:string;location:string}){
 const {lang,t}=useI18n();const navigate=useNavigate();const[items,setItems]=useState<Business[]>([]);const[loading,setLoading]=useState(false);const[error,setError]=useState('');
 useEffect(()=>{setItems([]);setError('');if(query.trim().length<2){setLoading(false);return;}let active=true;const controller=new AbortController();setLoading(true);const timer=setTimeout(()=>{businessService.searchPage(query,category,0,1,location,controller.signal).then(r=>{if(active)setItems(r.data.slice(0,5));}).catch(()=>{if(active)setError('Suggestions are unavailable. Press Search to retry.');}).finally(()=>{if(active)setLoading(false);});},300);return()=>{active=false;controller.abort();clearTimeout(timer);};},[query,category,location]);
 if(query.trim().length<2)return null;
 return <section className="entity-suggestions" aria-label={t('Matching businesses','মিলে যাওয়া প্রতিষ্ঠান')} aria-busy={loading}><p role="status">{loading?t('Finding matching listings…','মিলে যাওয়া প্রতিষ্ঠান খোঁজা হচ্ছে…'):error?t('Suggestions are unavailable. Press Search to retry.','প্রস্তাবিত প্রতিষ্ঠান দেখা যাচ্ছে না। আবার চেষ্টা করতে অনুসন্ধান চাপুন।'):!items.length?t('No matches in this area. Try another area or broader keyword.','এই এলাকায় কোনো প্রতিষ্ঠান পাওয়া যায়নি। অন্য এলাকা বা সাধারণ শব্দ দিয়ে খুঁজুন।'):t('Select the correct business and branch','সঠিক প্রতিষ্ঠান ও শাখা বাছুন')}</p>{items.map(b=><button type="button" key={b.id} onClick={()=>navigate(`/business/${b.slug}`)}><strong>{lang==='bn'&&b.bengaliName?b.bengaliName:b.name}</strong><span>{translateCategory(b.category,lang)} · {b.location||t('Address not supplied','ঠিকানা দেওয়া নেই')}</span></button>)}</section>;
}
