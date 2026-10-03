"use client";
import {useEffect,useRef,useState} from 'react';
import {GoogleMap} from './GoogleMap';
import {useI18n} from '../i18n/LanguageContext';
import {localizedError} from '../i18n/dictionary';

type Place={id:string;formattedAddress?:string;displayName?:string;fetchFields:(options:{fields:string[]})=>Promise<unknown>};
type PlacesLibrary={PlaceAutocompleteElement:new(options:{includedRegionCodes:string[]})=>HTMLElement};
type MapsWindow=Window&{google?:{maps:{importLibrary:(name:string)=>Promise<PlacesLibrary>}}};
let loading:Promise<PlacesLibrary>|undefined;
function loadPlaces(key:string){
 if(!loading)loading=new Promise<void>((resolve,reject)=>{
  if((window as MapsWindow).google?.maps){resolve();return;}
  const script=document.createElement('script');script.src=`https://maps.googleapis.com/maps/api/js?${new URLSearchParams({key,libraries:'places',v:'weekly'})}`;script.async=true;
  script.onload=()=>resolve();script.onerror=()=>{script.remove();reject(new Error('Google Maps could not load. Enter an address manually.'));};document.head.appendChild(script);
 }).then(()=>{const maps=(window as MapsWindow).google?.maps;if(!maps)throw new Error('Google Maps is unavailable. Enter an address manually.');return maps.importLibrary('places');}).catch(error=>{loading=undefined;throw error;});
 return loading;
}

export function BusinessLocationPicker({name,address,placeId,onSelect}:{name:string;address:string;placeId?:string;onSelect:(address:string,placeId:string)=>void}){
 const {lang,t}=useI18n();
 const key=process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;const[enabled,setEnabled]=useState(false);const[message,setMessage]=useState('');const host=useRef<HTMLDivElement>(null);const selection=useRef(onSelect);selection.current=onSelect;
 useEffect(()=>{if(!enabled||!key)return;let cancelled=false;let widget:HTMLElement|undefined;
  loadPlaces(key).then(({PlaceAutocompleteElement})=>{if(cancelled||!host.current)return;widget=new PlaceAutocompleteElement({includedRegionCodes:['bd']});widget.setAttribute('aria-label',t('Find your business on Google Maps','গুগল মানচিত্রে আপনার প্রতিষ্ঠান খুঁজুন'));
   widget.addEventListener('gmp-error',()=>{if(!cancelled)setMessage(t('Google Places is unavailable. You can still search Maps or enter the address manually.','গুগল প্লেসের প্রস্তাবিত ঠিকানা পাওয়া যাচ্ছে না। মানচিত্রে খুঁজুন বা নিজে ঠিকানা লিখুন।'));});
   widget.addEventListener('gmp-select',async(event:Event)=>{try{const place=(event as Event&{placePrediction:{toPlace:()=>Place}}).placePrediction.toPlace();await place.fetchFields({fields:['id','formattedAddress','displayName']});if(!cancelled){selection.current(place.formattedAddress||place.displayName||'',place.id);setMessage(t('Place selected. Confirm this is the correct branch before continuing.','ঠিকানা নির্বাচিত হয়েছে। এগোনোর আগে সঠিক শাখা কিনা নিশ্চিত করুন।'));}}catch{if(!cancelled)setMessage(t('Could not retrieve that place. Please enter the address manually.','ওই ঠিকানাটি পাওয়া যায়নি। নিজে ঠিকানা লিখুন।'));}});
   host.current.appendChild(widget);
  }).catch(e=>{if(!cancelled){const error=(e as Error).message;setMessage(error==='Google Maps could not load. Enter an address manually.'||error==='Google Maps is unavailable. Enter an address manually.'?t('Google Maps could not load. Enter an address manually.','গুগল মানচিত্র লোড করা যায়নি। নিজে ঠিকানা লিখুন।'):localizedError(error,lang));}});return()=>{cancelled=true;widget?.remove();};
 },[enabled,key,t,lang]);
 return <section className="workspace-card" aria-label={t('Organization location on Google Maps','গুগল মানচিত্রে প্রতিষ্ঠানের অবস্থান')}>
  <h3>{t('Find this organization on Google Maps','গুগল মানচিত্রে প্রতিষ্ঠানটি খুঁজুন')}</h3>
  <p>{t('Choose the correct branch, or enter an address manually. A Maps match does not verify ownership.','সঠিক শাখা বাছুন অথবা নিজে ঠিকানা লিখুন। মানচিত্রে মিলে গেলেই প্রোফাইলের মালিকানা যাচাই হয় না।')}</p>
  {key&&!enabled&&<button type="button" className="btn-pill-light" onClick={()=>setEnabled(true)}>{t('Enable Google place search','গুগল প্লেসে অনুসন্ধান চালু করুন')}</button>}
  {!key&&<p>{t('Search Google Maps below, then enter the address above. In-form suggestions are not available yet; you can still add this business manually.','নিচে গুগল মানচিত্রে খুঁজে উপরে ঠিকানা লিখুন। ফর্মে প্রস্তাবিত ঠিকানার সুবিধা এখন নেই; নিজে ঠিকানা দিয়ে প্রতিষ্ঠান যোগ করা যাবে।')}</p>}
  <div ref={host}/>{message&&<p role="status">{message}</p>}
  {address.trim()?<GoogleMap name={name} location={address} placeId={placeId} lang={lang}/>:<a className="btn-pill-light" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?${new URLSearchParams({api:'1',query:[name,address,'Bangladesh'].filter(Boolean).join(', ')})}`}>{t('Search on Google Maps ↗','গুগল মানচিত্রে খুঁজুন ↗')}</a>}
 </section>;
}
