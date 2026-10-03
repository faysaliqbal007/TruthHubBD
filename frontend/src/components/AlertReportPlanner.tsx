import {useState} from 'react';
import {Link} from 'react-router-dom';
export function AlertReportPlanner(){
 const [purpose,setPurpose]=useState('report');
 const [checked,setChecked]=useState<string[]>([]);
 const items=['Business name or profile link','Date and sequence of events','Relevant receipt or messages','What resolution you requested'];
 return <section className="workspace-card"><span className="alert-eyebrow">YOUR NEXT STEP</span><h2>Find the right route</h2>
 <label>What would you like to do? <select value={purpose} onChange={e=>setPurpose(e.target.value)}><option value="report">Report a serious concern</option><option value="follow">Add evidence or check progress</option><option value="appeal">Disagree with a decision</option><option value="review">Share an ordinary experience</option></select></label>
 {purpose==='report'?<><p>Prepare only relevant information. Scam alert submissions are verified by moderators before being published publicly to warn everyone.</p><fieldset><legend>Preparation checklist · {checked.length}/{items.length}</legend>{items.map(item=><label key={item} style={{display:'flex',gap:8,margin:'10px 0'}}><input type="checkbox" checked={checked.includes(item)} onChange={e=>setChecked(old=>e.target.checked?[...old,item]:old.filter(x=>x!==item))}/>{item}</label>)}</fieldset><small>This checklist stays only on this page and resets when you leave. Do not paste sensitive evidence here.</small><Link to="/scam-alerts/submit">Submit a scam alert →</Link></>:
 purpose==='follow'?<><p>Open your activity, find the case and respond to the review team’s evidence request. Keep your case code for reference.</p><Link to="/activity">View my cases →</Link></>:
 purpose==='appeal'?<><p>Use the appeal option on your case in Activity. Explain which decision you dispute and why. One pending appeal per person and case is allowed.</p><Link to="/activity">Find my case and appeal →</Link></>:
 <><p>For everyday service feedback, find the entity and write a review. Incorrect listing details can be reported using “Suggest a correction” on its profile.</p><Link to="/search">Find an entity →</Link></>}
 </section>;
}
