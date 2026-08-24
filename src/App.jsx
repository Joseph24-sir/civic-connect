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
    'Electricity': ['Power Outage','Street Light Fault','Illegal Connection','Transformer Issue','Billing'],
    'Roads & Potholes': ['Pothole','Road Damage','No Road Signs','Flooding','Gravel Road'],
    'Waste Management': ['Uncollected Refuse','Illegal Dumping','Overgrown Grass','Dead Animal'],
    'Housing & Infrastructure': ['RDP House Issue','Cracked Wall','Roof Leak','Toilet Issue'],
    'Health & Safety': ['Clinic Issue','Unsafe Structure','Crime Hotspot','Noise'],
  }
  const municipalities = {
    'Capricorn': ['Polokwane','Lepelle-Nkumpi','Molemole','Blouberg'],
    'Mopani': ['Giyani','Tzaneen','Ba-Phalaborwa','Maruleng','Greater Letaba'],
    'Vhembe': ['Thohoyandou','Musina','Makhado','Collins Chabane'],
    'Waterberg': ['Mokopane','Bela-Bela','Lephalale','Modimolle'],
    'Sekhukhune': ['Groblersdal','Burgersfort','Jane Furse','Makhuduthamaga']
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
    if(!form.ward ||!form.town ||!form.desc) return alert('Please fill Ward Number, Village/Town and Description')
    const hid=await hashID(idNum)
    // Build detailed location string for secure storage
    const fullLocation = `Ward ${form.ward}, ${form.town}${form.street? ', '+form.street:''} (${form.municipality}, ${form.district})${form.landmark? ' - Near '+form.landmark:''}`
    const detailedDesc = `[${form.mainCategory} - ${form.subCategory}] [Urgency: ${form.urgency}] [Location: ${fullLocation}] ${form.desc}`

    await supabase.from('reports').insert({
      user_hash:hid,
      type:`${form.mainCategory} - ${form.subCategory}`,
      district:form.district,
      description:detailedDesc,
      lat:form.lat||null,lng:form.lng||null,status:'pending'
    })
    await supabase.from('notifications').insert({message:`NEW ${form.mainCategory} in Ward ${form.ward} ${form.town}: ${form.subCategory}`})
    alert(`Report Submitted! Ward ${form.ward} - Ubuntu service will respond!`);
    setPage('citizen'); fetchReports(); fetchNotifs()
  }

  async function updateStatus(id,status){
    await supabase.from('reports').update({status}).eq('id',id)
    await supabase.from('notifications').insert({message:`Report #${(id || '').slice(0,6)} marked ${(status || '').toUpperCase()} by Gov`})
    fetchReports(); fetchNotifs()
  }
  async function scheduleMeeting(){
    if(!meetDate ||!meetLoc) return alert('Enter date and location')
    const report=reports.find(r=>r.id===meetForm)
    await supabase.from('meetings').insert({report_id:meetForm,user_hash:report.user_hash,date:meetDate,location:meetLoc})
    await supabase.from('notifications').insert({message:`MEETING ${meetDate} at ${meetLoc} for ${report?.type}`})
    setMeetForm(null); setMeetDate(''); setMeetLoc(''); fetchMeetings(); fetchNotifs(); alert('Meeting Scheduled!')
  }

  const myReports=user?.role==='citizen'?reports.filter(r=>r.user_hash===user.id_hash):reports
  const myMeetings=user?.role==='citizen'?meetings.filter(m=>m.user_hash===user.id_hash):meetings
  const filtered=filter==='all'?myReports:myReports.filter(r=>r.status===filter || r.district===filter)

  const ProfileBox=()=>(
    <div style={{background:'#fff',border:'3px solid #000',borderRadius:16,padding:20,margin:'20px auto',maxWidth:900}}>
      <h2>🔒 My Secure Profile - Owner Only</h2>
      <p style={{fontSize:11, background:'#e8f5e9', padding:8, borderRadius:8}}>POPIA Secure: Raw ID/Passport only in your session. Only you can view.</p>
      <p><b>Private Document (Click to reveal):</b> <span style={{background:'#000',color:'#000',padding:'4px 10px',borderRadius:6,cursor:'pointer'}} onClick={e=>e.target.style.color='#ffd700'}>{user?.secureId}</span></p>
      <button onClick={()=>setShowProfile(false)} style={{marginTop:12,padding:'8px 16px',background:'#000',color:'#ffd700',border:0,borderRadius:8}}>Close</button>
    </div>
  )
  const StatBox=()=>{
    const total=reports.length, pending=reports.filter(r=>r.status==='pending').length, prog=reports.filter(r=>r.status==='in_progress').length, fixed=reports.filter(r=>r.status==='fixed').length
    return (
      <div style={{background:'#fff',border:'3px solid #000',borderRadius:16,padding:20,margin:'20px auto',maxWidth:900}}>
        <h2>📊 Limpopo Impact</h2>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:10}}>
          <div style={{background:'#000',color:'#ffd700',padding:15,borderRadius:10,textAlign:'center'}}><h3>{total}</h3><small>TOTAL</small></div>
          <div style={{background:'#ff9800',color:'#fff',padding:15,borderRadius:10,textAlign:'center'}}><h3>{pending}</h3><small>PENDING</small></div>
          <div style={{background:'#2196f3',color:'#fff',padding:15,borderRadius:10,textAlign:'center'}}><h3>{prog}</h3><small>IN PROGRESS</small></div>
          <div style={{background:'#4caf50',color:'#fff',padding:15,borderRadius:10,textAlign:'center'}}><h3>{fixed}</h3><small>FIXED</small></div>
        </div>
        <button onClick={()=>setShowStats(false)} style={{marginTop:15,padding:'8px 16px'}}>Close</button>
      </div>
    )
  }
  const PortalModal=()=>(
    <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.8)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:999,padding:20}}>
      <div style={{background:'#f5f5dc',borderRadius:20,padding:25,maxWidth:750,width:'100%',border:'4px solid #000',position:'relative'}}>
        <button onClick={()=>{setShowPortalModal(false);setPortalType(null)}} style={{position:'absolute',top:10,right:15,background:'#000',color:'#fff',border:0,borderRadius:50,width:30,height:30}}>X</button>
        <h2 style={{textAlign:'center'}}>🇿🇦 Choose Portal - Ubuntu Secure</h2>
        {!portalType? (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:15,marginTop:20}}>
            <div onClick={()=>setPortalType('citizen')} style={{background:'#fff',border:'3px solid #007a4d',borderRadius:16,padding:20,textAlign:'center',cursor:'pointer'}}>
              <div style={{fontSize:50}}>👥</div><h3>Citizen Portal</h3><p style={{fontSize:12}}>ID or Passport • Secure & Private</p><div style={{background:'#007a4d',color:'#fff',padding:'10px',borderRadius:8,marginTop:10,fontWeight:'bold'}}>ENTER AS CITIZEN</div>
            </div>
            <div onClick={()=>setPortalType('gov')} style={{background:'#fff',border:'3px solid #000',borderRadius:16,padding:20,textAlign:'center',cursor:'pointer'}}>
              <div style={{fontSize:50}}>🏛️</div><h3>Government Portal</h3><p style={{fontSize:12}}>Authorized officials only</p><div style={{background:'#000',color:'#ffd700',padding:'10px',borderRadius:8,marginTop:10,fontWeight:'bold'}}>ENTER AS GOV</div>
            </div>
          </div>
        ) : (
          <div style={{background:'#fff',padding:20,borderRadius:16,marginTop:15,border:'3px solid #000'}}>
            <h3 style={{textAlign:'center'}}>{portalType==='citizen'? '👥 Citizen Secure Login' : '🏛️ Government Login'}</h3>
            <input value={idNum} onChange={e=>setIdNum(e.target.value)} placeholder={portalType==='citizen'? 'SA ID (13 digits) / Passport Number' : 'Gov Official ID / Passport'} style={{width:'100%',padding:12,margin:'8px 0',borderRadius:8,border:'1px solid #000'}}/>
            {portalType==='citizen' && <input value={personalInfo.fullName} onChange={e=>setPersonalInfo({...personalInfo,fullName:e.target.value})} placeholder="Full Name (private)" style={{width:'100%',padding:10,margin:'6px 0',borderRadius:8,border:'1px solid #aaa'}}/>}
            {portalType==='gov' && (<><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Government Email" style={{width:'100%',padding:12,margin:'8px 0',borderRadius:8,border:'1px solid #000'}}/><input value={pass} onChange={e=>setPass(e.target.value)} placeholder="Gov Code" type="password" style={{width:'100%',padding:12,margin:'8px 0',borderRadius:8,border:'1px solid #000'}}/></>)}
            <button onClick={portalType==='citizen'? loginCit : loginGov} style={{width:'100%',padding:12,background:portalType==='citizen'?'#007a4d':'#000',color:portalType==='citizen'?'#fff':'#ffd700',border:0,borderRadius:8,marginTop:10,fontWeight:'bold'}}>{portalType==='citizen'? 'SECURE LOGIN AS CITIZEN' : 'LOGIN AS GOV'}</button>
            <button onClick={()=>setPortalType(null)} style={{width:'100%',marginTop:10,background:'none',border:0}}>← Back</button>
          </div>
        )}
      </div>
    </div>
  )

  if(page==='landing') return (
    <div style={{minHeight:'100vh',background:'#f5f5dc',padding:0,fontFamily:'sans-serif'}}>
      {showPortalModal && <PortalModal/>}
      <div style={{background:'#000',color:'#ffd700',padding:'12px 20px',display:'flex',justifyContent:'space-between'}}><b>🇿🇦 CIVIC-CONNECT LIMPOPO | POPIA SECURE</b><span style={{fontSize:12, background:'#ffd700',color:'#000',padding:'4px 10px',borderRadius:20}}>Ubuntu</span></div>
      <div style={{maxWidth:1100,margin:'0 auto',padding:'30px 20px',textAlign:'center'}}>
        <div style={{background:'#fff',padding:'50px 30px',borderRadius:24,border:'4px solid #000',marginTop:20}}>
          <div onClick={()=>setShowPortalModal(true)} style={{width:120,height:120,background:'#000',borderRadius:'50%',margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'center',fontSize:60,cursor:'pointer',border:'4px solid #ffd700'}}>🇿🇦</div>
          <h1 style={{fontSize:52,margin:'20px 0 10px'}}>CIVIC-CONNECT</h1>
          <p style={{fontSize:18, fontWeight:'bold'}}>Limpopo's Digital Bridge Between Citizens & Government</p>
          <div style={{background:'#000',color:'#ffd700',padding:'10px 18px',borderRadius:30,display:'inline-block',marginTop:15,fontStyle:'italic',fontWeight:'bold'}}>🤝 "Motho ke motho ka batho - I am because we are"</div>
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
          <div><button onClick={()=>setShowProfile(!showProfile)} style={{background:'#fff',border:0,padding:'6px 12px',borderRadius:8,marginRight:8,fontWeight:'bold'}}>🔒 My Profile</button><button onClick={()=>setShowStats(!showStats)} style={{background:'#ffd700',border:0,padding:'6px 12px',borderRadius:8,marginRight:8,fontWeight:'bold'}}>📊 STATS</button><button onClick={()=>{setUser(null);setPage('landing')}} style={{background:'#fff',border:0,padding:'6px 12px',borderRadius:8}}>Logout</button></div>
        </div>

        <div style={{background:'#000',color:'#fff',padding:10,borderRadius:10,marginTop:12,border:'2px solid #ffd700'}}><b>🔔 NOTIFICATIONS:</b><div style={{maxHeight:80,overflowY:'auto',marginTop:6}}>{notifs.length===0?<small>No notifications</small>:notifs.map(n=><div key={n.id} style={{fontSize:12,borderBottom:'1px solid #333',padding:'3px 0'}}>• {n.message} — {n.created_at? new Date(n.created_at).toLocaleString():''}</div>)}</div></div>

        {showProfile && <ProfileBox/>}
        {showStats && <StatBox/>}

        {user.role==='citizen' && myMeetings.length>0 && (
          <div style={{background:'#e3f2fd',border:'2px solid #2196f3',borderRadius:12,padding:12,marginTop:12}}>
            <b>📅 YOUR PRIVATE MEETINGS:</b>
            {myMeetings.map(m=><div key={m.id} style={{background:'#fff',padding:8,borderRadius:8,marginTop:6}}>📍 {m.location} — 📅 {m.date} — Report {(m.report_id||'').slice(0,6)}</div>)}
          </div>
        )}

        <div style={{display:'flex',gap:10,marginTop:12,flexWrap:'wrap'}}>
          <button onClick={()=>setFilter('all')} style={{padding:'8px 12px',background:filter==='all'?'#000':'#fff',color:filter==='all'?'#ffd700':'#000',border:'1px solid #000',borderRadius:8}}>All</button>
          <button onClick={()=>setFilter('pending')} style={{padding:'8px 12px',background:'#ff9800',color:'#fff',border:0,borderRadius:8}}>Pending</button>
          <button onClick={()=>setFilter('in_progress')} style={{padding:'8px 12px',background:'#2196f3',color:'#fff',border:0,borderRadius:8}}>In Progress</button>
          <button onClick={()=>setFilter('fixed')} style={{padding:'8px 12px',background:'#4caf50',color:'#fff',border:0,borderRadius:8}}>Fixed</button>
          <button onClick={()=>{setPage('report'); window.scrollTo(0,0)}} style={{marginLeft:'auto',padding:'10px 18px',background:'#007a4d',color:'#fff',border:0,borderRadius:8,fontWeight:'bold'}}>+ NEW REPORT</button>
        </div>

        {page==='report' && (
          <div style={{background:'#fff',padding:20,borderRadius:16,border:'3px solid #000',marginTop:15}}>
            <h2 style={{textAlign:'center',marginTop:0}}>📝 New Community Report - Detailed & Secure</h2>
            <p style={{textAlign:'center',fontSize:11,background:'#e8f5e9',padding:6,borderRadius:8}}>🔒 Your identity is hashed & private. Provide accurate location for faster service. Ubuntu: Your report helps community.</p>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:15}}>
              <div>
                <label style={{fontWeight:'bold',fontSize:12}}>CATEGORY OF COMPLAINT *</label>
                <select value={form.mainCategory} onChange={e=>setForm({...form,mainCategory:e.target.value, subCategory: categories[e.target.value][0]})} style={{width:'100%',padding:12,margin:'6px 0',borderRadius:8,border:'2px solid #000'}}>
                  {Object.keys(categories).map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontWeight:'bold',fontSize:12}}>SPECIFIC ISSUE *</label>
                <select value={form.subCategory} onChange={e=>setForm({...form,subCategory:e.target.value})} style={{width:'100%',padding:12,margin:'6px 0',borderRadius:8,border:'2px solid #000'}}>
                  {categories[form.mainCategory].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginTop:10}}>
              <div>
                <label style={{fontWeight:'bold',fontSize:12}}>DISTRICT *</label>
                <select value={form.district} onChange={e=>setForm({...form,district:e.target.value, municipality: municipalities[e.target.value][0]})} style={{width:'100%',padding:10,margin:'6px 0',borderRadius:8}}>
                  {Object.keys(municipalities).map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontWeight:'bold',fontSize:12}}>MUNICIPALITY *</label>
                <select value={form.municipality} onChange={e=>setForm({...form,municipality:e.target.value})} style={{width:'100%',padding:10,margin:'6px 0',borderRadius:8}}>
                  {municipalities[form.district].map(m=><option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontWeight:'bold',fontSize:12}}>WARD NUMBER *</label>
                <input value={form.ward} onChange={e=>setForm({...form,ward:e.target.value})} placeholder="e.g. 12, 34" type="number" style={{width:'100%',padding:10,margin:'6px 0',borderRadius:8,border:'2px solid #ff9800'}}/>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:10}}>
              <div>
                <label style={{fontWeight:'bold',fontSize:12}}>VILLAGE / TOWN / TOWNSHIP *</label>
                <input value={form.town} onChange={e=>setForm({...form,town:e.target.value})} placeholder="e.g. Seshego, Mankweng, Lebowakgomo" style={{width:'100%',padding:10,margin:'6px 0',borderRadius:8,border:'2px solid #000'}}/>
              </div>
              <div>
                <label style={{fontWeight:'bold',fontSize:12}}>STREET / LOCATION DETAILS *</label>
                <input value={form.street} onChange={e=>setForm({...form,street:e.target.value})} placeholder="e.g. 123 Main Rd, Zone 3, Stand No" style={{width:'100%',padding:10,margin:'6px 0',borderRadius:8}}/>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:10}}>
              <div>
                <label style={{fontWeight:'bold',fontSize:12}}>NEAREST LANDMARK</label>
                <input value={form.landmark} onChange={e=>setForm({...form,landmark:e.target.value})} placeholder="e.g. Near clinic, Shoprite, School" style={{width:'100%',padding:10,margin:'6px 0',borderRadius:8}}/>
              </div>
              <div>
                <label style={{fontWeight:'bold',fontSize:12}}>URGENCY LEVEL *</label>
                <select value={form.urgency} onChange={e=>setForm({...form,urgency:e.target.value})} style={{width:'100%',padding:10,margin:'6px 0',borderRadius:8,background:form.urgency==='High'?'#ffebee':form.urgency==='Critical'?'#ffcdd2':'#fff'}}>
                  <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                </select>
              </div>
            </div>

            <div style={{marginTop:10}}>
              <label style={{fontWeight:'bold',fontSize:12}}>DETAILED DESCRIPTION *</label>
              <textarea value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} placeholder="Describe the issue in detail: How long has it been happening? How does it affect community? Any safety concerns? Be specific for faster response - Ubuntu spirit!" style={{width:'100%',padding:12,margin:'6px 0',height:90,borderRadius:8,border:'2px solid #000'}}/>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:10}}>
              <input value={form.lat} onChange={e=>setForm({...form,lat:e.target.value})} placeholder="Latitude (optional - auto detect)" style={{width:'100%',padding:8,borderRadius:8,border:'1px solid #aaa'}}/>
              <input value={form.lng} onChange={e=>setForm({...form,lng:e.target.value})} placeholder="Longitude (optional)" style={{width:'100%',padding:8,borderRadius:8,border:'1px solid #aaa'}}/>
            </div>

            <button onClick={submitReport} style={{width:'100%',padding:14,background:'#000',color:'#ffd700',border:0,borderRadius:10,marginTop:15,fontWeight:'bold',fontSize:16}}>📤 SUBMIT DETAILED REPORT - Secure & Ubuntu</button>
            <button onClick={()=>setPage('citizen')} style={{width:'100%',marginTop:8,background:'none',border:0}}>Cancel</button>
          </div>
        )}

        <div style={{marginTop:15,display:'grid',gap:12}}>
          {filtered.map(r=>{
            // Parse location details from description
            const isDetailed = r.description?.includes('[Location:')
            return (
            <div key={r.id} style={{background:'#fff',padding:15,borderRadius:12,borderLeft:`8px solid ${r.status==='fixed'?'#4caf50':r.status==='in_progress'?'#2196f3':'#ff9800'}`,border:'1px solid #ddd'}}>
              <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap'}}><b style={{fontSize:14}}>{r.type}</b><span style={{padding:'4px 10px',borderRadius:20,fontSize:11,background:r.status==='fixed'?'#4caf50':r.status==='in_progress'?'#2196f3':'#ff9800',color:'#fff'}}>{(r.status||'').toUpperCase()}</span></div>
              <div style={{fontSize:11,marginTop:6,background:'#f5f5dc',padding:6,borderRadius:6}}>
                📍 {r.district} {r.description?.match(/\[Location: (.*?)\]/)?.[1] || ''} | Urgency: {r.description?.match(/Urgency: (.*?)\]/)?.[1] || 'Medium'}
              </div>
              <p style={{margin:'8px 0',fontSize:13}}>{r.description?.replace(/\[.*?\] /g,'')}</p>
              <small style={{color:'#666'}}>{r.created_at? new Date(r.created_at).toLocaleString():''} • Ref: #{(r.id||'').slice(0,6)} • Ward: {r.description?.match(/Ward (\d+)/)?.[1] || 'N/A'}</small>
              {user.role==='gov' && (
                <div style={{marginTop:10,display:'flex',gap:8,flexWrap:'wrap'}}>
                  <button onClick={()=>updateStatus(r.id,'in_progress')} style={{padding:'6px 12px',background:'#2196f3',color:'#fff',border:0,borderRadius:6}}>⏳ IN PROGRESS</button>
                  <button onClick={()=>updateStatus(r.id,'fixed')} style={{padding:'6px 12px',background:'#4caf50',color:'#fff',border:0,borderRadius:6}}>✅ FIXED</button>
                  <button onClick={()=>setMeetForm(r.id)} style={{padding:'6px 12px',background:'#000',color:'#ffd700',border:0,borderRadius:6}}>📅 SCHEDULE MEETING</button>
                </div>
              )}
              {meetForm===r.id && (
                <div style={{marginTop:10,background:'#f5f5f5',padding:10,borderRadius:8}}>
                  <input value={meetDate} onChange={e=>setMeetDate(e.target.value)} type="date" style={{padding:8,marginRight:8}}/><input value={meetLoc} onChange={e=>setMeetLoc(e.target.value)} placeholder="Location" style={{padding:8,width:220}}/>
                  <button onClick={scheduleMeeting} style={{padding:'8px 12px',background:'#000',color:'#ffd700',border:0,borderRadius:6,marginLeft:8}}>Confirm</button><button onClick={()=>setMeetForm(null)} style={{marginLeft:8,background:'none',border:0}}>Cancel</button>
                </div>
              )}
            </div>
          )})}
        </div>
      </div>
    </div>
  )
}