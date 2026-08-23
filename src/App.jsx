import { useState, useEffect } from 'react'
import './App.css'

function maskID(id, isOwner){
  if(!id) return '••••'
  if(isOwner) return id
  if(id.length===13) return '•••••••••' + id.slice(-4)
  return '••••' + id.slice(-3)
}
function validateSAID(id) {
  if (!/^\d{13}$/.test(id)) return { ok:false, msg:'SA ID must be 13 digits' }
  const yy = parseInt(id.slice(0,2),10)
  const mm = parseInt(id.slice(2,4),10)
  const dd = parseInt(id.slice(4,6),10)
  if (mm<1||mm>12||dd<1||dd>31) return { ok:false, msg:'Invalid birth date in ID' }
  const now = new Date()
  const fullYear = yy <= (now.getFullYear()%100)? 2000+yy : 1900+yy
  const birth = new Date(fullYear, mm-1, dd)
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m<0 || (m===0 && now.getDate() < birth.getDate())) age--
  if (age<18) return { ok:false, msg:`Must be 18+ years. You are ${age}.` }
  return { ok:true }
}

export default function App(){
  const [flow, setFlow] = useState('welcome')
  const [users, setUsers] = useState(()=>{ try{return JSON.parse(localStorage.getItem('cc_users')||'[]')}catch{return []}})
  const [issues, setIssues] = useState(()=>{ try{return JSON.parse(localStorage.getItem('cc_issues')||'[]')}catch{return []}})
  const [notifs, setNotifs] = useState(()=>{ try{return JSON.parse(localStorage.getItem('cc_notifs')||'[]')}catch{return []}})
  const [currentUser, setCurrentUser] = useState(()=>{ try{return JSON.parse(localStorage.getItem('cc_current')||'null')}catch{return null}})
  const [citForm, setCitForm] = useState({ name:'', idType:'SA ID', idNumber:'', phone:'', password:'' })
  const [govForm, setGovForm] = useState({ name:'', workId:'', dept:'', email:'', password:'' })
  const [loginForm, setLoginForm] = useState({ idNumber:'', password:'' })
  const [issueForm, setIssueForm] = useState({ category:'', province:'Gauteng', area:'', town:'', ward:'', description:'' })
  const [authTab, setAuthTab] = useState('login')
  const [filterCat, setFilterCat] = useState('All')
  const [showId, setShowId] = useState(false)

  useEffect(()=>localStorage.setItem('cc_users', JSON.stringify(users)),[users])
  useEffect(()=>localStorage.setItem('cc_issues', JSON.stringify(issues)),[issues])
  useEffect(()=>localStorage.setItem('cc_notifs', JSON.stringify(notifs)),[notifs])
  useEffect(()=>localStorage.setItem('cc_current', JSON.stringify(currentUser)),[currentUser])

  const categories = ['Water & Sanitation','Roads & Transport','Electricity','Housing','Health','Safety & Security','Other']
  const provinces = ['Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo','Mpumalanga','Northern Cape','North West','Western Cape']
  const depts = ['Water Affairs','Public Works','Energy','Human Settlements','Health','SAPS','Municipality']

  const handleCitRegister = (e)=>{
    e.preventDefault()
    if(citForm.idType==='SA ID'){ const v=validateSAID(citForm.idNumber); if(!v.ok) return alert(v.msg) }
    else if(!/^[A-Z0-9]{6,12}$/i.test(citForm.idNumber)) return alert('Passport 6-12 chars')
    if(users.find(u=>u.idNumber===citForm.idNumber)) return alert('Already registered')
    const newUser={...citForm, role:'citizen', id:Date.now()}
    setUsers([...users,newUser]); setCurrentUser(newUser); setFlow('citizenDash')
  }
  const handleGovRegister = (e)=>{
    e.preventDefault()
    if(!govForm.email.includes('@') ||!govForm.email.toLowerCase().includes('gov')) return alert('Use official gov email e.g. name@dept.gov.za')
    if(users.find(u=>u.workId===govForm.workId)) return alert('Work ID exists')
    const newUser={...govForm, role:'government', id:Date.now(), idNumber:govForm.workId}
    setUsers([...users,newUser]); setCurrentUser(newUser); setFlow('govDash')
  }
  const handleLogin = (e, role)=>{
    e.preventDefault()
    const found=users.find(u=>u.idNumber===loginForm.idNumber && u.password===loginForm.password && u.role===role)
    if(!found) return alert(`No ${role} account with that ID. Please register.`)
    setCurrentUser(found); setFlow(role==='citizen'?'citizenDash':'govDash')
  }
  const submitIssue = (e)=>{
    e.preventDefault()
    if(!issueForm.category||!issueForm.description) return alert('Category & description required')
    const newIssue={ id:Date.now(), citizenId: currentUser.idNumber, citizenName: currentUser.name,...issueForm, date:new Date().toLocaleString(), status:'Received', feedback:'' }
    setIssues([newIssue,...issues])
    setNotifs([{id:Date.now(), forRole:'government', msg:`New ${newIssue.category} in ${newIssue.town}`, issueId:newIssue.id, date:new Date().toLocaleTimeString()},...notifs])
    setIssueForm({ category:'', province:'Gauteng', area:'', town:'', ward:'', description:'' })
    alert('Complaint sent to Government!')
  }
  const updateStatus = (id, status)=>{
    const fb = (status==='Fixed' || status==='Awaiting Response')? prompt(`Feedback for citizen (${status}):`)||'' : ''
    setIssues(issues.map(i=> i.id===id? {...i, status, feedback:fb}:i))
    const iss=issues.find(i=>i.id===id)
    setNotifs([{id:Date.now(), forRole:'citizen', forUser:iss.citizenId, msg:`Your "${iss.category}" is now: ${status}${fb? ' - '+fb:''}`, issueId:id, date:new Date().toLocaleTimeString()},...notifs])
  }

  const stats = categories.map(cat=>({cat, count: issues.filter(i=>i.category===cat).length}))
  const myIssues = currentUser? issues.filter(i=>i.citizenId===currentUser.idNumber):[]
  const filteredIssues = filterCat==='All'? issues : issues.filter(i=>i.category===filterCat)
  const myNotifs = currentUser? notifs.filter(n=> n.forRole===currentUser.role && (!n.forUser || n.forUser===currentUser.idNumber)) : []

  if(flow==='welcome') return (
    <main className="welcome-screen" role="main" aria-label="Welcome page">
      <a href="#main" className="skip-link">Skip to content</a>
      <section className="welcome-panel" id="main" aria-labelledby="welcome-title">
        <span className="welcome-brand">ZA • UBUNTU</span>
        <h1 id="welcome-title">Your Voice Matters</h1>
        <p className="welcome-brand">Civic-Connect</p>
        <p className="welcome-copy">Every street, every village, every ward. From Musina to Cape Town, we listen and help communities thrive. Ubuntu — I am because we are.</p>
        <button className="welcome-arrow" onClick={()=>setFlow('choosePortal')} aria-label="Enter Civic-Connect, choose citizen or government portal" style={{border:'none'}}>→</button>
        <p className="welcome-copy" style={{fontWeight:800, color:'#0a3d2e'}}>Press icon to start</p>
        <p className="welcome-footer">Free • Safe • Confidential IDs • WCAG Accessible • 9 Provinces 🇿🇦</p>
      </section>
    </main>
  )

  if(flow==='choosePortal') return (
    <main style={{minHeight:'100vh', background:'#f8faf9', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px'}} role="main">
      <section style={{maxWidth:'720px', width:'100%'}}>
        <button onClick={()=>setFlow('welcome')} style={{background:'none', border:'1px solid #ddd', padding:'8px 14px', borderRadius:'8px', cursor:'pointer'}}>← Back</button>
        <h1 style={{textAlign:'center', color:'#0a3d2e'}}>Choose Your Portal</h1>
        <p style={{textAlign:'center', color:'#666'}}>Separate secure access - work together</p>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginTop:'24px'}}>
          <button onClick={()=>{setFlow('citizenAuth'); setAuthTab('login')}} style={{textAlign:'left', background:'white', border:'3px solid #007A4D', borderRadius:'20px', padding:'24px', cursor:'pointer'}}>
            <h2 style={{margin:'0 0 8px', color:'#0a3d2e'}}>🧑 Citizen Portal</h2>
            <ul style={{fontSize:'14px', color:'#333', paddingLeft:'18px', lineHeight:'1.6'}}><li>SA ID must be 18+</li><li>Passport for foreigners</li><li>ID confidential - masked</li><li>Report + notifications</li></ul>
            <p style={{fontWeight:'bold', color:'#007A4D', marginTop:'16px'}}>Enter Citizen →</p>
          </button>
          <button onClick={()=>{setFlow('govAuth'); setAuthTab('login')}} style={{textAlign:'left', background:'white', border:'3px solid #1565c0', borderRadius:'20px', padding:'24px', cursor:'pointer'}}>
            <h2 style={{margin:'0 0 8px', color:'#0d47a1'}}>🏛️ Government Portal</h2>
            <ul style={{fontSize:'14px', color:'#333', paddingLeft:'18px', lineHeight:'1.6'}}><li>Work ID + Dept</li><li>gov.za email required</li><li>Cannot access citizen</li><li>Manage complaints</li></ul>
            <p style={{fontWeight:'bold', color:'#1565c0', marginTop:'16px'}}>Enter Government →</p>
          </button>
        </div>
      </section>
    </main>
  )

  if(flow==='citizenAuth' || flow==='govAuth'){
    const isCit = flow==='citizenAuth'
    return (
      <main style={{minHeight:'100vh', background:'#f8faf9', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px'}} role="main">
        <section style={{background:'white', width:'100%', maxWidth:'440px', padding:'28px', borderRadius:'20px', boxShadow:'0 10px 40px rgba(0,0,0,0.08)'}}>
          <button onClick={()=>setFlow('choosePortal')} style={{border:'none', background:'none', cursor:'pointer', fontWeight:'bold'}}>← Choose Portal</button>
          <h2 style={{color: isCit? '#0a3d2e' : '#0d47a1', marginTop:'12px'}}>{isCit? 'Citizen Portal' : 'Government Portal'}</h2>
          <div style={{display:'flex', gap:'8px', margin:'16px 0'}}>
            <button onClick={()=>setAuthTab('login')} style={{flex:1, padding:'10px', borderRadius:'8px', border:'1px solid #ddd', background: authTab==='login'? '#0a3d2e':'white', color: authTab==='login'?'white':'#333', cursor:'pointer', fontWeight:'bold'}}>Login</button>
            <button onClick={()=>setAuthTab('register')} style={{flex:1, padding:'10px', borderRadius:'8px', border:'1px solid #ddd', background: authTab==='register'? '#0a3d2e':'white', color: authTab==='register'?'white':'#333', cursor:'pointer', fontWeight:'bold'}}>Register</button>
          </div>
          {authTab==='login'? (
            <form onSubmit={(e)=>handleLogin(e, isCit?'citizen':'government')}>
              <input placeholder={isCit? 'SA ID / Passport' : 'Work ID'} value={loginForm.idNumber} onChange={e=>setLoginForm({...loginForm, idNumber:e.target.value})} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid #ddd', marginBottom:'10px'}} required />
              <input type="password" placeholder="Password" value={loginForm.password} onChange={e=>setLoginForm({...loginForm, password:e.target.value})} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid #ddd', marginBottom:'10px'}} required />
              <button type="submit" style={{width:'100%', padding:'14px', background: isCit? '#007A4D':'#1565c0', color:'white', border:'none', borderRadius:'10px', fontWeight:'bold', cursor:'pointer'}}>Login →</button>
            </form>
          ) : isCit? (
            <form onSubmit={handleCitRegister}>
              <input placeholder="Full Name" value={citForm.name} onChange={e=>setCitForm({...citForm, name:e.target.value})} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid #ddd', marginBottom:'10px'}} required />
              <div style={{display:'flex', gap:'8px', marginBottom:'10px'}}>
                <select value={citForm.idType} onChange={e=>setCitForm({...citForm, idType:e.target.value})} style={{padding:'12px', borderRadius:'10px', border:'1px solid #ddd', flex:1}}><option>SA ID</option><option>Passport</option></select>
                <input placeholder={citForm.idType==='SA ID'? '13-digit SA ID' : 'Passport'} value={citForm.idNumber} onChange={e=>setCitForm({...citForm, idNumber:e.target.value})} style={{padding:'12px', borderRadius:'10px', border:'1px solid #ddd', flex:2}} required />
              </div>
              <p style={{fontSize:'11px', color:'#666', margin:'-6px 0 10px'}}>ID confidential, masked to gov. Must be 18+.</p>
              <input type="password" placeholder="Create Password" value={citForm.password} onChange={e=>setCitForm({...citForm, password:e.target.value})} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid #ddd', marginBottom:'10px'}} required />
              <button type="submit" style={{width:'100%', padding:'14px', background:'#007A4D', color:'white', border:'none', borderRadius:'10px', fontWeight:'bold', cursor:'pointer'}}>Register →</button>
            </form>
          ) : (
            <form onSubmit={handleGovRegister}>
              <input placeholder="Full Name" value={govForm.name} onChange={e=>setGovForm({...govForm, name:e.target.value})} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid #ddd', marginBottom:'10px'}} required />
              <input placeholder="Work ID" value={govForm.workId} onChange={e=>setGovForm({...govForm, workId:e.target.value})} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid #ddd', marginBottom:'10px'}} required />
              <select value={govForm.dept} onChange={e=>setGovForm({...govForm, dept:e.target.value})} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid #ddd', marginBottom:'10px'}} required><option value="">Select Dept</option>{depts.map(d=><option key={d}>{d}</option>)}</select>
              <input placeholder="Gov Email @gov.za" value={govForm.email} onChange={e=>setGovForm({...govForm, email:e.target.value})} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid #ddd', marginBottom:'10px'}} required />
              <input type="password" placeholder="Password" value={govForm.password} onChange={e=>setGovForm({...govForm, password:e.target.value})} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid #ddd', marginBottom:'10px'}} required />
              <button type="submit" style={{width:'100%', padding:'14px', background:'#1565c0', color:'white', border:'none', borderRadius:'10px', fontWeight:'bold', cursor:'pointer'}}>Register →</button>
            </form>
          )}
        </section>
      </main>
    )
  }

  if(flow==='citizenDash') return (
    <div style={{minHeight:'100vh', background:'#f5f9f6'}}>
      <header style={{background:'#0a3d2e', color:'white', padding:'14px 20px', display:'flex', justifyContent:'space-between'}}>
        <b>Citizen 🇿🇦 {currentUser?.name} | ID: {showId? currentUser?.idNumber : maskID(currentUser?.idNumber, false)} <button onClick={()=>setShowId(!showId)} style={{background:'none', border:'none', color:'white', cursor:'pointer'}}>{showId? '🙈':'👁️'}</button></b>
        <div>🔔{myNotifs.length} <button onClick={()=>{setCurrentUser(null); setFlow('welcome')}} style={{marginLeft:'10px', background:'white', color:'#0a3d2e', border:'none', padding:'6px 12px', borderRadius:'8px', cursor:'pointer', fontWeight:'bold'}}>Logout</button></div>
      </header>
      <main style={{maxWidth:'1100px', margin:'0 auto', padding:'20px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
        <section style={{background:'white', padding:'20px', borderRadius:'16px'}}>
          <h2>📢 Report Issue</h2>
          <form onSubmit={submitIssue} style={{display:'flex', flexDirection:'column', gap:'10px', marginTop:'12px'}}>
            <select value={issueForm.category} onChange={e=>setIssueForm({...issueForm, category:e.target.value})} style={{padding:'11px', borderRadius:'8px', border:'1px solid #ddd'}} required><option value="">Category</option>{categories.map(c=><option key={c}>{c}</option>)}</select>
            <select value={issueForm.province} onChange={e=>setIssueForm({...issueForm, province:e.target.value})} style={{padding:'11px', borderRadius:'8px', border:'1px solid #ddd'}}>{provinces.map(p=><option key={p}>{p}</option>)}</select>
            <input placeholder="Area" value={issueForm.area} onChange={e=>setIssueForm({...issueForm, area:e.target.value})} style={{padding:'11px', borderRadius:'8px', border:'1px solid #ddd'}} />
            <input placeholder="Town/City" value={issueForm.town} onChange={e=>setIssueForm({...issueForm, town:e.target.value})} style={{padding:'11px', borderRadius:'8px', border:'1px solid #ddd'}} required />
            <textarea placeholder="Description" value={issueForm.description} onChange={e=>setIssueForm({...issueForm, description:e.target.value})} rows={4} style={{padding:'11px', borderRadius:'8px', border:'1px solid #ddd'}} required />
            <button type="submit" style={{padding:'13px', background:'#007A4D', color:'white', border:'none', borderRadius:'10px', fontWeight:'bold', cursor:'pointer'}}>Send to Government →</button>
          </form>
        </section>
        <section>
          <div style={{background:'white', padding:'16px', borderRadius:'16px', marginBottom:'16px'}}><h3>🔔 Notifications</h3>{myNotifs.map(n=><div key={n.id} style={{background:'#e8f5e9', padding:'8px 10px', borderRadius:'8px', marginTop:'6px', fontSize:'13px'}}>{n.msg}</div>)}</div>
          <div style={{background:'white', padding:'16px', borderRadius:'16px', marginBottom:'16px'}}><h3>📊 My Stats</h3>{myIssues.length===0? 'No complaints': categories.map(c=>{ const cnt=myIssues.filter(i=>i.category===c).length; return cnt>0? <div key={c} style={{display:'flex', justifyContent:'space-between', fontSize:'14px', padding:'4px 0'}}><span>{c}</span><b>{cnt}</b></div>:null })}</div>
          <div style={{background:'white', padding:'16px', borderRadius:'16px'}}><h3>My Complaints</h3>{myIssues.map(i=><div key={i.id} style={{borderLeft:'4px solid #007A4D', background:'#fafafa', padding:'10px', borderRadius:'8px', marginTop:'8px'}}><b>{i.category}</b> - {i.town} <small style={{float:'right'}}>{i.status}</small><p style={{fontSize:'13px'}}>{i.description}</p>{i.feedback && <p style={{fontSize:'12px', background:'#e3f2fd', padding:'6px', borderRadius:'6px'}}><b>Gov:</b> {i.feedback}</p>}</div>)}</div>
        </section>
      </main>
    </div>
  )

  return (
    <div style={{minHeight:'100vh', background:'#f5f7fb'}}>
      <header style={{background:'#0d47a1', color:'white', padding:'14px 20px', display:'flex', justifyContent:'space-between'}}><b>Government 🏛️ {currentUser?.name} - {currentUser?.dept}</b><button onClick={()=>{setCurrentUser(null); setFlow('welcome')}} style={{background:'white', color:'#0d47a1', border:'none', padding:'6px 12px', borderRadius:'8px', cursor:'pointer', fontWeight:'bold'}}>Logout</button></header>
      <main style={{maxWidth:'1200px', margin:'0 auto', padding:'20px'}}>
        <section style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px,1fr))', gap:'12px', marginBottom:'20px'}}>{stats.map(s=><div key={s.cat} style={{background:'white', padding:'12px', borderRadius:'12px', textAlign:'center'}}><b style={{fontSize:'20px'}}>{s.count}</b><br/><small>{s.cat}</small></div>)}</section>
        <section style={{background:'white', padding:'16px', borderRadius:'16px'}}>
          <h2>All Complaints - IDs masked for privacy</h2>
          <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{padding:'8px', borderRadius:'8px', border:'1px solid #ddd'}}><option>All</option>{categories.map(c=><option key={c}>{c}</option>)}</select>
          {filteredIssues.map(issue=>(
            <div key={issue.id} style={{border:'1px solid #eee', padding:'14px', borderRadius:'12px', marginTop:'12px'}}>
              <b>{issue.category} • {issue.province} - {issue.status}</b>
              <p style={{fontSize:'13px'}}><b>{issue.citizenName}</b> | ID: {maskID(issue.citizenId,false)} (confidential) | {issue.town}, {issue.area}</p>
              <p style={{fontSize:'13px'}}>{issue.description}</p>
              <div style={{display:'flex', gap:'8px', marginTop:'10px', flexWrap:'wrap'}}>{['Received','In Progress','Awaiting Response','Fixed'].map(st=><button key={st} onClick={()=>updateStatus(issue.id, st)} style={{padding:'6px 10px', borderRadius:'8px', border:'1px solid #ddd', cursor:'pointer', background: issue.status===st? '#0d47a1':'white', color: issue.status===st? 'white':'#333'}}>{st}</button>)}</div>
              {issue.feedback && <p style={{fontSize:'12px', background:'#f1f8e9', padding:'6px', borderRadius:'6px', marginTop:'8px'}}>Feedback: {issue.feedback}</p>}
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}