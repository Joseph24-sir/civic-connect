import { useState, useEffect } from 'react'
import { supabase, hashID } from './supabase.js'

export default function App(){
  const [page,setPage]=useState('landing')
  const [showPortalModal,setShowPortalModal]=useState(false)
  const [portalType,setPortalType]=useState(null)
  const [user,setUser]=useState(null)
  const [idNum,setIdNum]=useState('')
  const [email,setEmail]=useState('')
  const [pass,setPass]=useState('')
  const [reports,setReports]=useState([])
  const [notifs,setNotifs]=useState([])
  const [meetings,setMeetings]=useState([])
  const [filter,setFilter]=useState('all')
  const [showStats,setShowStats]=useState(false)
  const [showProfile,setShowProfile]=useState(false)
  const [meetForm,setMeetForm]=useState(null)
  const [meetDate,setMeetDate]=useState('')
  const [meetLoc,setMeetLoc]=useState('')
  const [form,setForm]=useState({
    mainCategory:'Water & Sanitation', subCategory:'No Water Supply',
    district:'Capricorn', municipality:'Polokwane', ward:'',
    town:'', street:'', landmark:'', urgency:'Medium', desc:'', lat:'', lng:''
  })
  const [personalInfo,setPersonalInfo]=useState({fullName:'', phone:''})

  const categories = {
    'Water & Sanitation': ['No Water Supply','Burst Pipe','Sewer Blockage','Dirty Water','Meter Leak'],
    'Electricity': ['Power Outage','Street Light Fault','Illegal Connection','Transformer Issue'],
    'Roads & Potholes': ['Pothole','Road Damage','No Road Signs','Flooding','Gravel Road'],
    'Waste Management': ['Uncollected Refuse','Illegal Dumping','Overgrown Grass'],
    'Housing & Infrastructure': ['RDP House Issue','Cracked Wall','Roof Leak'],
    'Health & Safety': ['Clinic Issue','Unsafe Structure','Crime Hotspot'],
  }
  const municipalities = {
    'Capricorn': ['Polokwane','Lepelle-Nkumpi','Molemole','Blouberg'],
    'Mopani': ['Giyani','Tzaneen','Ba-Phalaborwa','Maruleng'],
    'Vhembe': ['Thohoyandou','Musina','Makhado','Collins Chabane'],
    'Waterberg': ['Mokopane','Bela-Bela','Lephalale','Modimolle'],
    'Sekhukhune': ['Groblersdal','Burgersfort','Jane Furse']
  }

  useEffect(()=>{ if(user){ fetchReports(); fetchNotifs(); fetchMeetings(); } },[user])
  async function fetchReports(){
    const {data}=await supabase.from('reports').select('*').order('created_at',{ascending:false})
    setReports(data||[])
  }
  async function fetchNotifs(){
    const {data}=await supabase.from('notifications').select('*').order('created_at',{ascending:false}).limit(10)
    setNotifs(data||[])
  }
  async function fetchMeetings(){
    const {data}=await supabase.from('meetings').select('*').order('created_at',{ascending:false})
    setMeetings(data||[])
  }

  async function loginGov(){
    if(!idNum.trim() ||!email.trim() ||!pass.trim()) return alert('Enter Gov ID/Passport, Email and Code')
    const hid=await hashID(idNum)
    const {data}=await supabase.from('profiles').select('*').eq('id_hash',hid).single()
    if(!data || data.email!==email || data.gov_code!==pass) return alert('Invalid Gov login')
    setUser({...data,role:'gov', secureId: idNum.trim()}); setPage('gov'); setShowPortalModal(false)
  }
  async function loginCit(){
    if(!idNum.trim()) return alert('Please enter ID or Passport number')
    const hid=await hashID(idNum)
    let {data}=await supabase.from('profiles').select('*').eq('id_hash',hid).single()
    if(!data){
      await supabase.from('profiles').insert({id_hash:hid,email:'citizen@local',gov_code:'',role:'citizen'})
      const r=await supabase.from('profiles').select('*').eq('id_hash',hid).single()
      data=r.data
    }
    setUser({...data,role:'citizen', secureId: idNum.trim()}); setPage('citizen'); setShowPortalModal(false)
  }

  async function submitReport(){
    if(!form.ward ||!form.town ||!form.desc) return alert('Fill Ward, Town and Description')
    const hid=await hashID(idNum)
    const fullLocation = `Ward ${form.ward}, ${form.town}${form.street? ', '+form.street:''} (${form.municipality}, ${form.district})${form.landmark? ' - Near '+form.landmark:''}`
    const detailedDesc = `[${form.mainCategory} - ${form.subCategory}] [Urgency: ${form.urgency}] [Location: ${fullLocation}] ${form.desc}`
    await supabase.from('reports').insert({user_hash:hid,type:`${form.mainCategory} - ${form.subCategory}`,district:form.district,description:detailedDesc,lat:form.lat||null,lng:form.lng||null,status:'pending'})
    await supabase.from('notifications').insert({message:`NEW ${form.mainCategory} in Ward ${form.ward} ${form.town}: ${form.subCategory}`})
    alert(`Report Submitted!`); setPage('citizen'); fetchReports(); fetchNotifs()
  }

  async function updateStatus(id,status){
    await supabase.from('reports').update({status}).eq('id',id)
    await supabase.from('notifications').insert({message:`Report #${(id||'').slice(0,6)} marked ${(status||'').toUpperCase()}`})
    fetchReports(); fetchNotifs()
  }
  async function scheduleMeeting(){
    if(!meetDate ||!meetLoc) return alert('Enter date and location')
    const report=reports.find(r=>r.id===meetForm)
    await supabase.from('meetings').insert({report_id:meetForm,user_hash:report.user_hash,date:meetDate,location:meetLoc})
    await supabase.from('notifications').insert({message:`MEETING ${meetDate} at ${meetLoc}`})
    setMeetForm(null); setMeetDate(''); setMeetLoc(''); fetchMeetings(); fetchNotifs()
  }

  const myReports=user?.role==='citizen'?reports.filter(r=>r.user_hash===user.id_hash):reports
  const myMeetings=user?.role==='citizen'?meetings.filter(m=>m.user_hash===user.id_hash):meetings
  const filtered=filter==='all'?myReports:myReports.filter(r=>r.status===filter || r.district===filter)

  // LANDING
  if(page==='landing') return (
    <div style={{minHeight:'100vh',background:'#f5f5dc',fontFamily:'sans-serif'}}>
      <div style={{background:'#000',color:'#ffd700',padding:'12px 20px',display:'flex',justifyContent:'space-between'}}><b>🇿🇦 CIVIC-CONNECT LIMPOPO | POPIA SECURE</b><span style={{fontSize:12,background:'#ffd700',color:'#000',padding:'4px 10px',borderRadius:20}}>Ubuntu</span></div>

      {showPortalModal && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999,padding:20}}>
          <div style={{background:'#f5f5dc',borderRadius:20,padding:25,maxWidth:750,width:'100%',border:'4px solid #000',position:'relative'}}>
            <button onClick={()=>{setShowPortalModal(false);setPortalType(null)}} style={{position:'absolute',top:10,right:15,background:'#000',color:'#fff',border:0,borderRadius:50,width:32,height:32,cursor:'pointer'}}>X</button>
            <h2 style={{textAlign:'center',marginTop:0}}>🇿🇦 Choose Portal - Ubuntu Secure</h2>
            {!portalType? (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:15,marginTop:20}}>
                <div onClick={()=>setPortalType('citizen')} style={{background:'#fff',border:'3px solid #007a4d',borderRadius:16,padding:20,textAlign:'center',cursor:'pointer'}}>
                  <div style={{fontSize:50}}>👥</div><h3>Citizen Portal</h3><p style={{fontSize:12}}>ID or Passport • Secure</p><div style={{background:'#007a4d',color:'#fff',padding:'10px',borderRadius:8,marginTop:10,fontWeight:'bold'}}>ENTER AS CITIZEN</div>
                </div>
                <div onClick={()=>setPortalType('gov')} style={{background:'#fff',border:'3px solid #000',borderRadius:16,padding:20,textAlign:'center',cursor:'pointer'}}>
                  <div style={{fontSize:50}}>🏛️</div><h3>Government Portal</h3><p style={{fontSize:12}}>Officials only</p><div style={{background:'#000',color:'#ffd700',padding:'10px',borderRadius:8,marginTop:10,fontWeight:'bold'}}>ENTER AS GOV</div>
                </div>
              </div>
            ) : (
              <div style={{background:'#fff',padding:20,borderRadius:16,marginTop:15,border:'3px solid #000'}}>
                <h3 style={{textAlign:'center',marginTop:0}}>{portalType==='citizen'? '👥 Citizen Secure Login' : '🏛️ Government Login'}</h3>
                <p style={{textAlign:'center',fontSize:11,background:'#e8f5e9',padding:6,borderRadius:8}}>🔒 Secure • Press Enter to login • POPIA compliant</p>

                {/* PROFESSIONAL INPUTS - FIXED FOCUS ISSUE */}
                <input
                  autoFocus
                  value={idNum}
                  onChange={e=>setIdNum(e.target.value)}
                  onKeyDown={e=>{ if(e.key==='Enter'){ portalType==='citizen'? loginCit() : loginGov() } }}
                  placeholder={portalType==='citizen'? 'SA ID (13 digits) / Passport Number - Type freely here' : 'Gov ID / Passport'}
                  style={{width:'100%',padding:14,margin:'8px 0',borderRadius:8,border:'2px solid #000',fontSize:16,outline:'none'}}
                />
                {portalType==='citizen' && (
                  <input
                    value={personalInfo.fullName}
                    onChange={e=>setPersonalInfo({...personalInfo,fullName:e.target.value})}
                    onKeyDown={e=>{ if(e.key==='Enter') loginCit() }}
                    placeholder="Full Name (private - optional)"
                    style={{width:'100%',padding:12,margin:'6px 0',borderRadius:8,border:'1px solid #aaa',fontSize:15}}
                  />
                )}
                {portalType==='gov' && (<>
                  <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Government Email" style={{width:'100%',padding:12,margin:'8px 0',borderRadius:8,border:'1px solid #000'}}/>
                  <input value={pass} onChange={e=>setPass(e.target.value)} placeholder="Gov Code" type="password" onKeyDown={e=>{ if(e.key==='Enter') loginGov() }} style={{width:'100%',padding:12,margin:'8px 0',borderRadius:8,border:'1px solid #000'}}/>
                </>)}
                <button onClick={portalType==='citizen'? loginCit : loginGov} style={{width:'100%',padding:14,background:portalType==='citizen'?'#007a4d':'#000',color:portalType==='citizen'?'#fff':'#ffd700',border:0,borderRadius:8,marginTop:12,fontWeight:'bold',fontSize:16,cursor:'pointer'}}>
                  {portalType==='citizen'? '✅ SECURE LOGIN - Press Enter' : '✅ LOGIN AS GOV'}
                </button>
                <button onClick={()=>setPortalType(null)} style={{width:'100%',marginTop:10,background:'none',border:0,cursor:'pointer'}}>← Back to Portals</button>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{maxWidth:1100,margin:'0 auto',padding:'30px 20px',textAlign:'center'}}>
        <div style={{background:'#fff',padding:'50px 30px',borderRadius:24,border:'4px solid #000',marginTop:20}}>
          <div onClick={()=>setShowPortalModal(true)} style={{width:120,height:120,background:'#000',borderRadius:'50%',margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'center',fontSize:60,cursor:'pointer',border:'4px solid #ffd700'}}>🇿🇦</div>
          <h1 style={{fontSize:52,margin:'20px 0 10px'}}>CIVIC-CONNECT</h1>
          <p style={{fontSize:18,fontWeight:'bold'}}>Limpopo's Digital Bridge</p>
          <div style={{background:'#000',color:'#ffd700',padding:'10px 18px',borderRadius:30,display:'inline-block',marginTop:15,fontStyle:'italic',fontWeight:'bold'}}>🤝 "Motho ke motho ka batho"</div>
          <div style={{marginTop:30}}><button onClick={()=>setShowPortalModal(true)} style={{padding:'18px 40px',background:'#000',color:'#ffd700',border:0,borderRadius:14,fontSize:20,fontWeight:'bold',cursor:'pointer'}}>🚪 CLICK ICON TO ENTER PORTALS →</button></div>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#f5f5dc',padding:15,fontFamily:'sans-serif'}}>
      <div style={{maxWidth:1000,margin:'0 auto'}}>
        <div style={{background:'#000',color:'#ffd700',padding:12,borderRadius:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <b>🇿🇦 {(user?.role||'').toUpperCase()} • Verified • Secure • Ubuntu</b>
          <div><button onClick={()=>setShowProfile(!showProfile)} style={{background:'#fff',border:0,padding:'6px 12px',borderRadius:8,marginRight:8,fontWeight:'bold',cursor:'pointer'}}>🔒 My Profile</button><button onClick={()=>setShowStats(!showStats)} style={{background:'#ffd700',border:0,padding:'6px 12px',borderRadius:8,marginRight:8,fontWeight:'bold',cursor:'pointer'}}>📊 STATS</button><button onClick={()=>{setUser(null);setPage('landing')}} style={{background:'#fff',border:0,padding:'6px 12px',borderRadius:8,cursor:'pointer'}}>Logout</button></div>
        </div>

        <div style={{background:'#000',color:'#fff',padding:10,borderRadius:10,marginTop:12,border:'2px solid #ffd700'}}><b>🔔 NOTIFICATIONS:</b><div style={{maxHeight:80,overflowY:'auto',marginTop:6}}>{notifs.map(n=><div key={n.id} style={{fontSize:12,borderBottom:'1px solid #333',padding:'3px 0'}}>• {n.message}</div>)}</div></div>

        {showProfile && <div style={{background:'#fff',border:'3px solid #000',borderRadius:16,padding:20,margin:'20px auto',maxWidth:900}}><h2>🔒 My Profile - Owner Only</h2><p>Private ID: <span style={{background:'#000',color:'#000',padding:'4px 10px',borderRadius:6,cursor:'pointer'}} onClick={e=>e.target.style.color='#ffd700'}>{user?.secureId}</span> (click to reveal)</p><button onClick={()=>setShowProfile(false)} style={{padding:'8px 16px',background:'#000',color:'#ffd700',border:0,borderRadius:8,cursor:'pointer'}}>Close</button></div>}

        {showStats && <div style={{background:'#fff',border:'3px solid #000',borderRadius:16,padding:20,margin:'20px auto',maxWidth:900}}><h2>📊 Stats</h2><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:10}}><div style={{background:'#000',color:'#ffd700',padding:15,borderRadius:10,textAlign:'center'}}><h3>{reports.length}</h3><small>TOTAL</small></div><div style={{background:'#ff9800',color:'#fff',padding:15,borderRadius:10,textAlign:'center'}}><h3>{reports.filter(r=>r.status==='pending').length}</h3><small>PENDING</small></div><div style={{background:'#2196f3',color:'#fff',padding:15,borderRadius:10,textAlign:'center'}}><h3>{reports.filter(r=>r.status==='in_progress').length}</h3><small>PROGRESS</small></div><div style={{background:'#4caf50',color:'#fff',padding:15,borderRadius:10,textAlign:'center'}}><h3>{reports.filter(r=>r.status==='fixed').length}</h3><small>FIXED</small></div></div><button onClick={()=>setShowStats(false)} style={{marginTop:15}}>Close</button></div>}

        <div style={{display:'flex',gap:10,marginTop:12,flexWrap:'wrap'}}><button onClick={()=>setFilter('all')} style={{padding:'8px 12px',background:filter==='all'?'#000':'#fff',color:filter==='all'?'#ffd700':'#000',border:'1px solid #000',borderRadius:8,cursor:'pointer'}}>All</button><button onClick={()=>setFilter('pending')} style={{padding:'8px 12px',background:'#ff9800',color:'#fff',border:0,borderRadius:8,cursor:'pointer'}}>Pending</button><button onClick={()=>setFilter('in_progress')} style={{padding:'8px 12px',background:'#2196f3',color:'#fff',border:0,borderRadius:8,cursor:'pointer'}}>In Progress</button><button onClick={()=>setFilter('fixed')} style={{padding:'8px 12px',background:'#4caf50',color:'#fff',border:0,borderRadius:8,cursor:'pointer'}}>Fixed</button><button onClick={()=>{setPage('report'); window.scrollTo(0,0)}} style={{marginLeft:'auto',padding:'10px 18px',background:'#007a4d',color:'#fff',border:0,borderRadius:8,fontWeight:'bold',cursor:'pointer'}}>+ NEW REPORT</button></div>

        {page==='report' && (
          <div style={{background:'#fff',padding:20,borderRadius:16,border:'3px solid #000',marginTop:15}}>
            <h2 style={{textAlign:'center'}}>📝 New Report - Detailed</h2>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:15}}>
              <div><label style={{fontWeight:'bold',fontSize:12}}>CATEGORY *</label><select value={form.mainCategory} onChange={e=>setForm({...form,mainCategory:e.target.value, subCategory: categories[e.target.value][0]})} style={{width:'100%',padding:12,margin:'6px 0',borderRadius:8,border:'2px solid #000'}}>{Object.keys(categories).map(c=><option key={c}>{c}</option>)}</select></div>
              <div><label style={{fontWeight:'bold',fontSize:12}}>SPECIFIC ISSUE *</label><select value={form.subCategory} onChange={e=>setForm({...form,subCategory:e.target.value})} style={{width:'100%',padding:12,margin:'6px 0',borderRadius:8,border:'2px solid #000'}}>{categories[form.mainCategory].map(s=><option key={s}>{s}</option>)}</select></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginTop:10}}>
              <div><label style={{fontWeight:'bold',fontSize:12}}>DISTRICT *</label><select value={form.district} onChange={e=>setForm({...form,district:e.target.value, municipality: municipalities[e.target.value][0]})} style={{width:'100%',padding:10,margin:'6px 0',borderRadius:8}}>{Object.keys(municipalities).map(d=><option key={d}>{d}</option>)}</select></div>
              <div><label style={{fontWeight:'bold',fontSize:12}}>MUNICIPALITY *</label><select value={form.municipality} onChange={e=>setForm({...form,municipality:e.target.value})} style={{width:'100%',padding:10,margin:'6px 0',borderRadius:8}}>{municipalities[form.district].map(m=><option key={m}>{m}</option>)}</select></div>
              <div><label style={{fontWeight:'bold',fontSize:12}}>WARD *</label><input value={form.ward} onChange={e=>setForm({...form,ward:e.target.value})} placeholder="e.g. 12" type="number" style={{width:'100%',padding:10,margin:'6px 0',borderRadius:8,border:'2px solid #ff9800'}}/></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:10}}>
              <div><label style={{fontWeight:'bold',fontSize:12}}>VILLAGE / TOWN *</label><input value={form.town} onChange={e=>setForm({...form,town:e.target.value})} placeholder="e.g. Seshego" style={{width:'100%',padding:10,margin:'6px 0',borderRadius:8,border:'2px solid #000'}}/></div>
              <div><label style={{fontWeight:'bold',fontSize:12}}>STREET / STAND *</label><input value={form.street} onChange={e=>setForm({...form,street:e.target.value})} placeholder="e.g. 123 Main Rd" style={{width:'100%',padding:10,margin:'6px 0',borderRadius:8}}/></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:10}}>
              <div><label style={{fontWeight:'bold',fontSize:12}}>LANDMARK</label><input value={form.landmark} onChange={e=>setForm({...form,landmark:e.target.value})} placeholder="Near clinic" style={{width:'100%',padding:10,margin:'6px 0',borderRadius:8}}/></div>
              <div><label style={{fontWeight:'bold',fontSize:12}}>URGENCY *</label><select value={form.urgency} onChange={e=>setForm({...form,urgency:e.target.value})} style={{width:'100%',padding:10,margin:'6px 0',borderRadius:8}}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></div>
            </div>
            <div style={{marginTop:10}}><label style={{fontWeight:'bold',fontSize:12}}>DESCRIPTION *</label><textarea value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} placeholder="Detailed description..." style={{width:'100%',padding:12,margin:'6px 0',height:90,borderRadius:8,border:'2px solid #000'}}/></div>
            <button onClick={submitReport} style={{width:'100%',padding:14,background:'#000',color:'#ffd700',border:0,borderRadius:10,marginTop:15,fontWeight:'bold',fontSize:16,cursor:'pointer'}}>📤 SUBMIT REPORT</button>
            <button onClick={()=>setPage('citizen')} style={{width:'100%',marginTop:8,background:'none',border:0,cursor:'pointer'}}>Cancel</button>
          </div>
        )}

        <div style={{marginTop:15,display:'grid',gap:12}}>
          {filtered.map(r=>(
            <div key={r.id} style={{background:'#fff',padding:15,borderRadius:12,borderLeft:`8px solid ${r.status==='fixed'?'#4caf50':r.status==='in_progress'?'#2196f3':'#ff9800'}`}}>
              <div style={{display:'flex',justifyContent:'space-between'}}><b>{r.type}</b><span style={{padding:'4px 10px',borderRadius:20,fontSize:11,background:r.status==='fixed'?'#4caf50':r.status==='in_progress'?'#2196f3':'#ff9800',color:'#fff'}}>{(r.status||'').toUpperCase()}</span></div>
              <p style={{margin:'8px 0',fontSize:13}}>{r.description?.replace(/\[.*?\] /g,'')}</p>
              <small>{r.created_at? new Date(r.created_at).toLocaleString():''} • #{(r.id||'').slice(0,6)}</small>
              {user.role==='gov' && (<div style={{marginTop:10,display:'flex',gap:8}}><button onClick={()=>updateStatus(r.id,'in_progress')} style={{padding:'6px 12px',background:'#2196f3',color:'#fff',border:0,borderRadius:6,cursor:'pointer'}}>IN PROGRESS</button><button onClick={()=>updateStatus(r.id,'fixed')} style={{padding:'6px 12px',background:'#4caf50',color:'#fff',border:0,borderRadius:6,cursor:'pointer'}}>FIXED</button><button onClick={()=>setMeetForm(r.id)} style={{padding:'6px 12px',background:'#000',color:'#ffd700',border:0,borderRadius:6,cursor:'pointer'}}>MEETING</button></div>)}
              {meetForm===r.id && (<div style={{marginTop:10,background:'#f5f5f5',padding:10,borderRadius:8}}><input value={meetDate} onChange={e=>setMeetDate(e.target.value)} type="date" style={{padding:8,marginRight:8}}/><input value={meetLoc} onChange={e=>setMeetLoc(e.target.value)} placeholder="Location" style={{padding:8,width:220}}/><button onClick={scheduleMeeting} style={{padding:'8px 12px',background:'#000',color:'#ffd700',border:0,borderRadius:6,marginLeft:8,cursor:'pointer'}}>Confirm</button></div>)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}