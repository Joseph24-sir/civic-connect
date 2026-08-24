import { useState, useEffect } from 'react'
import { supabase, hashID } from './supabase.js'

export default function App(){
  const [page,setPage]=useState('landing')
  const [user,setUser]=useState(null)
  const [idNum,setIdNum]=useState('')
  const [email,setEmail]=useState('')
  const [pass,setPass]=useState('')
  const [reports,setReports]=useState([])
  const [notifs,setNotifs]=useState([])
  const [meetings,setMeetings]=useState([])
  const [filter,setFilter]=useState('all')
  const [showStats,setShowStats]=useState(false)
  const [meetForm,setMeetForm]=useState(null)
  const [meetDate,setMeetDate]=useState('')
  const [meetLoc,setMeetLoc]=useState('')
  const [form,setForm]=useState({type:'Pothole',district:'Capricorn',desc:'',lat:'',lng:''})

  useEffect(()=>{
    if(user){ fetchReports(); fetchNotifs(); fetchMeetings(); }
  },[user])

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
    const hid=await hashID(idNum)
    const {data}=await supabase.from('profiles').select('*').eq('id_hash',hid).single()
    if(!data || data.email!==email || data.gov_code!==pass) return alert('Invalid Gov login')
    setUser({...data,role:'gov'}); setPage('gov')
  }
  async function loginCit(){
    const hid=await hashID(idNum)
    let {data}=await supabase.from('profiles').select('*').eq('id_hash',hid).single()
    if(!data){
      await supabase.from('profiles').insert({id_hash:hid,email:'citizen@local',gov_code:'',role:'citizen'})
      const r=await supabase.from('profiles').select('*').eq('id_hash',hid).single()
      data=r.data
    }
    setUser({...data,role:'citizen'}); setPage('citizen')
  }

  async function submitReport(){
    const hid=await hashID(idNum)
    await supabase.from('reports').insert({user_hash:hid,type:form.type,district:form.district,description:form.desc,lat:form.lat||null,lng:form.lng||null,status:'pending'})
    await supabase.from('notifications').insert({message:`NEW ${form.type} in ${form.district}: ${form.desc.slice(0,60)}`})
    alert('Report Submitted!'); setPage('citizen'); fetchReports(); fetchNotifs()
  }

  async function updateStatus(id,status){
    await supabase.from('reports').update({status}).eq('id',id)
    await supabase.from('notifications').insert({message:`Report #${id.slice(0,6)} marked ${status.toUpperCase()} by Gov`})
    fetchReports(); fetchNotifs()
  }

  async function scheduleMeeting(){
    if(!meetDate ||!meetLoc) return alert('Enter date and location')
    const report=reports.find(r=>r.id===meetForm)
    await supabase.from('meetings').insert({report_id:meetForm,user_hash:report.user_hash,date:meetDate,location:meetLoc})
    await supabase.from('notifications').insert({message:`MEETING scheduled ${meetDate} at ${meetLoc} for ${report.type}`})
    setMeetForm(null); setMeetDate(''); setMeetLoc(''); fetchMeetings(); fetchNotifs(); alert('Meeting Scheduled!')
  }

  const myReports=user?.role==='citizen'?reports.filter(r=>r.user_hash===user.id_hash):reports
  const myMeetings=user?.role==='citizen'?meetings.filter(m=>m.user_hash===user.id_hash):meetings
  const filtered=filter==='all'?myReports:myReports.filter(r=>r.status===filter || r.district===filter)

  if(page==='landing') return (
    <div style={{minHeight:'100vh',background:'#f5f5dc',padding:20,fontFamily:'sans-serif'}}>
      <div style={{maxWidth:900,margin:'0 auto',background:'#000',color:'#ffd700',padding:12,borderRadius:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <b>🇿🇦 CIVIC-CONNECT LIMPOPO</b><button onClick={()=>setPage('stats')} style={{background:'#ffd700',border:0,padding:'6px 12px',borderRadius:8,fontWeight:'bold'}}>📊 STATS</button>
      </div>
      <div style={{maxWidth:900,margin:'40px auto',textAlign:'center',background:'#fff',padding:40,borderRadius:16,border:'3px solid #000'}}>
        <h1 style={{fontSize:48,margin:0}}>🇿🇦 CIVIC-CONNECT</h1>
        <p>Report Issues • Track Status • Meet Government</p>
        <button onClick={()=>setPage('login')} style={{marginTop:20,padding:'16px 40px',background:'#000',color:'#ffd700',border:0,borderRadius:12,fontSize:20,fontWeight:'bold',cursor:'pointer'}}>ENTER PLATFORM →</button>
      </div>
    </div>
  )

  if(page==='login') return (
    <div style={{minHeight:'100vh',background:'#f5f5dc',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:'#fff',padding:30,borderRadius:16,width:360,border:'3px solid #000'}}>
        <h2 style={{textAlign:'center'}}>Login</h2>
        <input value={idNum} onChange={e=>setIdNum(e.target.value)} placeholder="ID Number (13 digits)" style={{width:'100%',padding:12,margin:'8px 0',borderRadius:8,border:'1px solid #000'}}/>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Gov Email (gov only)" style={{width:'100%',padding:12,margin:'8px 0',borderRadius:8,border:'1px solid #000'}}/>
        <input value={pass} onChange={e=>setPass(e.target.value)} placeholder="Gov Code (gov only)" type="password" style={{width:'100%',padding:12,margin:'8px 0',borderRadius:8,border:'1px solid #000'}}/>
        <button onClick={loginGov} style={{width:'100%',padding:12,background:'#000',color:'#ffd700',border:0,borderRadius:8,marginTop:10,fontWeight:'bold'}}>GOV LOGIN</button>
        <button onClick={loginCit} style={{width:'100%',padding:12,background:'#007a4d',color:'#fff',border:0,borderRadius:8,marginTop:10,fontWeight:'bold'}}>CITIZEN LOGIN</button>
        <button onClick={()=>setPage('landing')} style={{width:'100%',marginTop:10,background:'none',border:0}}>← Back</button>
      </div>
    </div>
  )

  const StatBox=()=>{
    const total=reports.length
    const pending=reports.filter(r=>r.status==='pending').length
    const prog=reports.filter(r=>r.status==='in_progress').length
    const fixed=reports.filter(r=>r.status==='fixed').length
    return (
      <div style={{background:'#fff',border:'3px solid #000',borderRadius:16,padding:20,margin:'20px auto',maxWidth:900}}>
        <h2>📊 LIMPOPO STATS</h2>
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

  return (
    <div style={{minHeight:'100vh',background:'#f5f5dc',padding:15,fontFamily:'sans-serif'}}>
      <div style={{maxWidth:1000,margin:'0 auto'}}>
        <div style={{background:'#000',color:'#ffd700',padding:12,borderRadius:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <b>🇿🇦 {user.role.toUpperCase()} • {user.id_hash.slice(0,8)} • {user.role==='citizen'?'8001015009087':email}</b>
          <div><button onClick={()=>setShowStats(!showStats)} style={{background:'#ffd700',border:0,padding:'6px 12px',borderRadius:8,marginRight:8,fontWeight:'bold'}}>📊 STATS</button><button onClick={()=>{setUser(null);setPage('landing')}} style={{background:'#fff',border:0,padding:'6px 12px',borderRadius:8}}>Logout</button></div>
        </div>

        <div style={{background:'#000',color:'#fff',padding:10,borderRadius:10,marginTop:12,border:'2px solid #ffd700'}}>
          <b>🔔 NOTIFICATIONS:</b>
          <div style={{maxHeight:80,overflowY:'auto',marginTop:6}}>
            {notifs.length===0?<small>No notifications</small>:notifs.map(n=><div key={n.id} style={{fontSize:12,borderBottom:'1px solid #333',padding:'3px 0'}}>• {n.message} — {new Date(n.created_at).toLocaleString()}</div>)}
          </div>
        </div>

        {showStats && <StatBox/>}

        {user.role==='citizen' && myMeetings.length>0 && (
          <div style={{background:'#e3f2fd',border:'2px solid #2196f3',borderRadius:12,padding:12,marginTop:12}}>
            <b>📅 MEETINGS SCHEDULED FOR YOU:</b>
            {myMeetings.map(m=><div key={m.id} style={{background:'#fff',padding:8,borderRadius:8,marginTop:6}}>📍 {m.location} — 📅 {m.date} — Report {m.report_id.slice(0,6)}</div>)}
          </div>
        )}

        <div style={{display:'flex',gap:10,marginTop:12,flexWrap:'wrap'}}>
          <button onClick={()=>setFilter('all')} style={{padding:'8px 12px',background:filter==='all'?'#000':'#fff',color:filter==='all'?'#ffd700':'#000',border:'1px solid #000',borderRadius:8}}>All</button>
          <button onClick={()=>setFilter('pending')} style={{padding:'8px 12px',background:'#ff9800',color:'#fff',border:0,borderRadius:8}}>Pending</button>
          <button onClick={()=>setFilter('in_progress')} style={{padding:'8px 12px',background:'#2196f3',color:'#fff',border:0,borderRadius:8}}>In Progress</button>
          <button onClick={()=>setFilter('fixed')} style={{padding:'8px 12px',background:'#4caf50',color:'#fff',border:0,borderRadius:8}}>Fixed</button>
          <button onClick={()=>setPage('report')} style={{marginLeft:'auto',padding:'8px 16px',background:'#007a4d',color:'#fff',border:0,borderRadius:8,fontWeight:'bold'}}>+ NEW REPORT</button>
        </div>

        {page==='report' && (
          <div style={{background:'#fff',padding:20,borderRadius:12,border:'3px solid #000',marginTop:15}}>
            <h3>New Report</h3>
            <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={{width:'100%',padding:10,margin:'6px 0'}}><option>Pothole</option><option>Water</option><option>Electricity</option><option>Waste</option><option>Road</option></select>
            <select value={form.district} onChange={e=>setForm({...form,district:e.target.value})} style={{width:'100%',padding:10,margin:'6px 0'}}><option>Capricorn</option><option>Mopani</option><option>Vhembe</option><option>Waterberg</option><option>Sekhukhune</option></select>
            <textarea value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} placeholder="Description..." style={{width:'100%',padding:10,margin:'6px 0',height:80}}/>
            <input value={form.lat} onChange={e=>setForm({...form,lat:e.target.value})} placeholder="Latitude (optional)" style={{width:'48%',padding:10,marginRight:'4%'}}/>
            <input value={form.lng} onChange={e=>setForm({...form,lng:e.target.value})} placeholder="Longitude (optional)" style={{width:'48%',padding:10}}/>
            <button onClick={submitReport} style={{width:'100%',padding:12,background:'#000',color:'#ffd700',border:0,borderRadius:8,marginTop:10,fontWeight:'bold'}}>SUBMIT REPORT</button>
            <button onClick={()=>setPage('citizen')} style={{width:'100%',marginTop:8,background:'none',border:0}}>Cancel</button>
          </div>
        )}

        <div style={{marginTop:15,display:'grid',gap:12}}>
          {filtered.map(r=>(
            <div key={r.id} style={{background:'#fff',padding:15,borderRadius:12,borderLeft:`8px solid ${r.status==='fixed'?'#4caf50':r.status==='in_progress'?'#2196f3':'#ff9800'}`}}>
              <div style={{display:'flex',justifyContent:'space-between'}}><b>{r.type} • {r.district}</b><span style={{padding:'4px 10px',borderRadius:20,fontSize:12,background:r.status==='fixed'?'#4caf50':r.status==='in_progress'?'#2196f3':'#ff9800',color:'#fff'}}>{r.status.toUpperCase()}</span></div>
              <p style={{margin:'8px 0'}}>{r.description}</p>
              <small>{new Date(r.created_at).toLocaleString()} • #{r.id.slice(0,6)}</small>
              {user.role==='gov' && (
                <div style={{marginTop:10,display:'flex',gap:8,flexWrap:'wrap'}}>
                  <button onClick={()=>updateStatus(r.id,'in_progress')} style={{padding:'6px 12px',background:'#2196f3',color:'#fff',border:0,borderRadius:6}}>⏳ IN PROGRESS</button>
                  <button onClick={()=>updateStatus(r.id,'fixed')} style={{padding:'6px 12px',background:'#4caf50',color:'#fff',border:0,borderRadius:6}}>✅ FIXED</button>
                  <button onClick={()=>setMeetForm(r.id)} style={{padding:'6px 12px',background:'#000',color:'#ffd700',border:0,borderRadius:6}}>📅 SCHEDULE MEETING</button>
                </div>
              )}
              {meetForm===r.id && (
                <div style={{marginTop:10,background:'#f5f5f5',padding:10,borderRadius:8}}>
                  <input value={meetDate} onChange={e=>setMeetDate(e.target.value)} type="date" style={{padding:8,marginRight:8}}/><input value={meetLoc} onChange={e=>setMeetLoc(e.target.value)} placeholder="Location e.g. Polokwane Civic Centre" style={{padding:8,width:220}}/>
                  <button onClick={scheduleMeeting} style={{padding:'8px 12px',background:'#000',color:'#ffd700',border:0,borderRadius:6,marginLeft:8}}>Confirm</button><button onClick={()=>setMeetForm(null)} style={{marginLeft:8,background:'none',border:0}}>Cancel</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}