"use client";
import type {ElementType} from 'react';
import {Building2, ChevronDown, GraduationCap, Hospital, Laptop, Layers, Stethoscope, Truck} from 'lucide-react';
import {useLanguage} from '../../i18n/LanguageContext';
import {translateCategory} from '../../i18n/dictionary';

export interface CategoryItem {name:string; icon?:ElementType}
export const CATEGORIES_LIST:CategoryItem[]=[
 {name:'Products',icon:Laptop},{name:'Businesses & Services',icon:Building2},
 {name:'Doctors & Professionals',icon:Stethoscope},{name:'Hospitals & Clinics',icon:Hospital},
 {name:'Universities & Education',icon:GraduationCap},{name:'Courier & Digital Services',icon:Truck}
];
export function CategoryDropdown({selectedCategory,onSelectCategory}:{selectedCategory:string;onSelectCategory:(name:string)=>void}){
 const {lang}=useLanguage(); const SelectedIcon=CATEGORIES_LIST.find(item=>item.name===selectedCategory)?.icon||Layers;
 const normalized=selectedCategory==='All'?'All Categories':selectedCategory;
 return <div className="category-dropdown-wrapper" style={{position:'relative',minWidth:0}}>
  <SelectedIcon size={16} aria-hidden="true" style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'var(--verm,#b7362a)',pointerEvents:'none'}}/>
  <select className="filter-select-pill" value={normalized} onChange={event=>onSelectCategory(event.target.value)} aria-label={lang==='bn'?'প্রতিষ্ঠানের ক্যাটাগরি':'Business category'} style={{appearance:'none',width:'100%',minHeight:44,padding:'10px 38px',fontSize:14,color:'var(--ink,#18243e)',border:'1px solid var(--line,#d8cdb7)',borderRadius:6,backgroundColor:'var(--raised,#fffdf7)',cursor:'pointer',fontFamily:'inherit'}}>
   <option value="All Categories">{translateCategory('All Categories',lang)}</option>
   {CATEGORIES_LIST.map(item=><option key={item.name} value={item.name}>{translateCategory(item.name,lang)}</option>)}
   {normalized!=='All Categories'&&!CATEGORIES_LIST.some(item=>item.name===normalized)&&<option value={normalized}>{translateCategory(normalized,lang)}</option>}
  </select>
  <ChevronDown size={16} aria-hidden="true" style={{position:'absolute',right:13,top:'50%',transform:'translateY(-50%)',color:'var(--mut,#565c6a)',pointerEvents:'none'}}/>
 </div>;
}
