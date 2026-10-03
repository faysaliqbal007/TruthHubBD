"use client";
import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';

/** Decorative enhancement; system reduced motion always takes precedence. */
export function MotionEffects(){
 const location=useLocation();
 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine=window.matchMedia('(hover: hover) and (pointer: fine)');
  if(media.matches||!fine.matches)return;
  let frame=0;let target:HTMLElement|null=null;
  const reset=()=>{if(target){target.style.removeProperty('--tilt-x');target.style.removeProperty('--tilt-y');target.removeAttribute('data-tilting');target=null;}};
  const move=(event:PointerEvent)=>{
   if(media.matches)return;
   const card=(event.target as Element).closest<HTMLElement>('.trust-journeys>a');
   if(card!==target){reset();target=card;}
   cancelAnimationFrame(frame);if(!card)return;
   frame=requestAnimationFrame(()=>{const box=card.getBoundingClientRect();const x=(event.clientX-box.left)/box.width;const y=(event.clientY-box.top)/box.height;card.style.setProperty('--tilt-x',`${(0.5-y)*5}deg`);card.style.setProperty('--tilt-y',`${(x-0.5)*5}deg`);card.style.setProperty('--light-x',`${x*100}%`);card.style.setProperty('--light-y',`${y*100}%`);card.dataset.tilting='true';});
  };
  document.addEventListener('pointermove',move,{passive:true});document.addEventListener('pointerleave',reset);media.addEventListener('change',reset);
  return()=>{cancelAnimationFrame(frame);reset();document.removeEventListener('pointermove',move);document.removeEventListener('pointerleave',reset);media.removeEventListener('change',reset);};
 },[location.pathname]);
 return null;
}
