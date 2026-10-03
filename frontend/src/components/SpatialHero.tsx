"use client";
import React, { useRef } from 'react';
import { Check, MapPin, ShieldCheck, Star } from 'lucide-react';
export function SpatialHero() {
  const scene = useRef<HTMLDivElement>(null);
  return <div className="spatial-stage" aria-hidden="true" onPointerMove={event => {
    if (!scene.current || document.documentElement.dataset.motion === 'paused' || !window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches) return;
    const box = event.currentTarget.getBoundingClientRect();
    scene.current.style.transform = `rotateX(${-(event.clientY-box.top-box.height/2)/35}deg) rotateY(${(event.clientX-box.left-box.width/2)/35}deg)`;
  }} onPointerLeave={() => { if(scene.current) scene.current.style.transform = 'rotateX(0deg) rotateY(0deg)'; }}>
    <div className="spatial-grid"/>
    <div className="spatial-scene" ref={scene}>
      <div className="orbital-ring ring-one"/><div className="orbital-ring ring-two"/><div className="orbital-ring ring-three"/>
      <div className="trust-monolith"><div className="monolith-glint"/><ShieldCheck strokeWidth={1.3}/><span>TRUTHHUB</span><small>THE TRUST LAYER</small></div>
      <div className="floating-signal signal-review"><div className="signal-icon"><Star fill="currentColor" size={17}/></div><span><strong>Real experiences</strong><small>Every voice has a place</small></span></div>
      <div className="floating-signal signal-verified"><div className="signal-icon"><Check size={18}/></div><span><strong>Clear trust signals</strong><small>Know what is verified</small></span></div>
      <div className="floating-signal signal-local"><MapPin size={16}/><strong>Made for Bangladesh</strong></div>
      <i className="spatial-spark spark-one"/><i className="spatial-spark spark-two"/><i className="spatial-spark spark-three"/>
    </div><div className="spatial-ground"/>
  </div>;
}
