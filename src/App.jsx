import { useState } from 'react'

export default function App() {
  // --- NAVIGATION: welcome -> portals -> app ---
  const [page, setPage] = useState("welcome") // welcome, portals, citizen, admin
  const [verifiedID, setVerifiedID] = useState(null)
  const [idInput, setIdInput] = useState("")
  const [idType, setIdType] = useState("ID")

  const validateSAID = (id) => {
    if (!/^\d{13}$/.test(id)) return false
    const month = parseInt(id.substring(2,4))
    const day = parseInt(id.substring(4,6))
    if (month < 1 || month > 12 || day < 1 || day > 31) return false
    let sum = 0
    for (let i = 0; i < 12; i++) {
      let digit = parseInt(id[i])
      if (i % 2 === 0) sum += digit
      else { let d = digit*2; sum += d>9?d-9:d }
    }
    return (10 - (sum % 10)) % 10 === parseInt(id[12])
  }
  const validatePassport = (p) => /^[A-Z]\d{8}$/.test(p.toUpperCase()) || /^\d{9}$/.test(p)

  const handleVerify = () => {
    if (idType==="ID" ? validateSAID(idInput) : validatePassport(idInput)) {
      setVerifiedID(idInput); setPage("citizen")
    } else alert(idType==="ID" ? "❌ Invalid SA ID. Try 9901015000087" : "❌ Invalid Passport. Try A12345678")
  }

  // --- ISSUES LOGIC (from before) ---
  const [issues, setIssues] = useState([
    { id: 1, title: "Pothole on Main Road", location: "Centurion", status: "Reported", date: new Date().toLocaleString(), meeting: null, ownerID: "990101****" },
    { id: 2, title: "Water Leak", location: "Pretoria", status: "In Progress", date: new Date().toLocaleString(), meeting: null, ownerID: "880202****" },
  ])
  const [title, setTitle] = useState("")
  const [location, setLocation] = useState("")
  const [showMeetingModal, setShowMeetingModal] = useState(null)
  const [meetingDate, setMeetingDate] = useState("")
  const [meetingTime, setMeetingTime] = useState("")
  const [meetingPlace, setMeetingPlace] = useState("Municipal Office, Centurion")
  const addIssue = () => { if(!title) return; setIssues([{id: issues.length+1, title, location, status: "Reported", date: new Date().toLocaleString(), meeting: null, ownerID: verifiedID}, ...issues]); setTitle(""); setLocation("") }
  const updateStatus = (id,s) => setIssues(issues.map(i=>i.id===id?{...i, status:s}:i))
  const scheduleMeeting = (id) => {
    if(!meetingDate || !meetingTime) return alert("Pick date & time")
    setIssues(issues.map(i=>i.id===id?{...i, meeting:{date: meetingDate, time: meetingTime, place: meetingPlace, status:"Pending"}, feedback:"Meeting scheduled"}:i))
    setShowMeetingModal(null)
  }

  // --- 1. WELCOMING PAGE ---
  if (page === "welcome") {
    return (
      <div style={{fontFamily: 'system-ui', minHeight: '100vh', background: 'linear-gradient(135deg, #052e16, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', color: 'white', textAlign: 'center'}}>
        <div>
          <div style={{fontSize: '80px', marginBottom: '20px', animation: 'bounce 2s infinite'}}>🇿🇦</div>
          <h1 style={{fontSize: '42px', fontWeight: '900', lineHeight: '1.1'}}>ZA • UBUNTU<br/>Civic-Connect</h1>
          <p style={{marginTop: '16px', fontSize: '18px', opacity: 0.9, maxWidth: '400px', margin: '16px auto'}}>Where Citizens and Government build South Africa together. Ubuntu — I am because we are.</p>
          
          {/* THE ICON TO PRESS */}
          <button onClick={()=>setPage("portals")} style={{marginTop: '32px', background: 'white', color: '#16a34a', border: 'none', width: '100px', height: '100px', borderRadius: '50%', fontSize: '48px', cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', fontWeight: '900'}}>
            →
          </button>
          <p style={{marginTop: '16px', fontSize: '13px', letterSpacing: '2px', opacity: 0.8}}>TAP ICON TO ENTER</p>
          <p style={{marginTop: '40px', fontSize: '11px', opacity: 0.6}}>Mechaflow Dynamics • Centurion, ZA • {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    )
  }

  // --- 2. PORTALS PAGE (Government or Citizen) ---
  if (page === "portals") {
    return (
      <div style={{fontFamily: 'system-ui', minHeight: '100vh', background: '#f8fafc', padding: '20px'}}>
        <div style={{maxWidth: '900px', margin: '0 auto'}}>
          <button onClick={()=>setPage("welcome")} style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', marginBottom: '20px'}}>← Back to Welcome</button>
          <h2 style={{fontSize: '32px', fontWeight: '900', textAlign: 'center', marginTop: '20px'}}>Choose Your Portal</h2>
          <p style={{textAlign: 'center', color: '#666', marginTop: '8px'}}>Select how you want to continue</p>
          
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '32px'}}>
            {/* CITIZEN PORTAL */}
            <button onClick={()=>setPage("verify")} style={{background: 'white', border: '2px solid #16a34a', borderRadius: '16px', padding: '24px', cursor: 'pointer', textAlign: 'left'}}>
              <div style={{fontSize: '48px'}}>👤</div>
              <h3 style={{fontSize: '20px', fontWeight: '800', marginTop: '12px'}}>Citizen Portal</h3>
              <p style={{fontSize: '13px', color: '#555', marginTop: '8px'}}>Report issues, track status, meet government. Requires SA ID / Passport verification.</p>
              <div style={{marginTop: '16px', background: '#16a34a', color: 'white', padding: '10px', borderRadius: '8px', textAlign: 'center', fontWeight: '700'}}>Enter as Citizen →</div>
              <p style={{fontSize: '11px', color: '#666', marginTop: '8px'}}>📅 Date & Time auto-added • 🔒 ID Verified</p>
            </button>

            {/* GOVERNMENT PORTAL */}
            <button onClick={()=>setPage("admin")} style={{background: '#111', border: '2px solid #111', borderRadius: '16px', padding: '24px', cursor: 'pointer', textAlign: 'left', color: 'white'}}>
              <div style={{fontSize: '48px'}}>🏛️</div>
              <h3 style={{fontSize: '20px', fontWeight: '800', marginTop: '12px'}}>Government Portal</h3>
              <p style={{fontSize: '13px', color: '#aaa', marginTop: '8px'}}>Manage all reports, update status, schedule meetings with citizens.</p>
              <div style={{marginTop: '16px', background: 'white', color: 'black', padding: '10px', borderRadius: '8px', textAlign: 'center', fontWeight: '700'}}>Enter as Government →</div>
              <p style={{fontSize: '11px', color: '#888', marginTop: '8px'}}>📊 Admin Dashboard • 📅 Meeting Scheduler</p>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- 3A. VERIFY ID PAGE ---
  if (page === "verify") {
    return (
      <div style={{fontFamily: 'system-ui', background: '#f8fafc', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'}}>
        <div style={{background: 'white', padding: '32px', borderRadius: '16px', maxWidth: '420px', width: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'}}>
          <button onClick={()=>setPage("portals")} style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', marginBottom: '16px'}}>← Portals</button>
          <h1 style={{fontWeight: '900', fontSize: '20px', textAlign: 'center'}}>Citizen Verification</h1>
          <div style={{marginTop: '16px', display: 'flex', gap: '8px'}}>
            <button onClick={()=>setIdType("ID")} style={{flex: 1, padding: '10px', borderRadius: '8px', border: idType==="ID"?'2px solid #16a34a':'1px solid #ddd', background: idType==="ID"?'#dcfce7':'white', fontWeight: '700'}}>SA ID</button>
            <button onClick={()=>setIdType("Passport")} style={{flex: 1, padding: '10px', borderRadius: '8px', border: idType==="Passport"?'2px solid #16a34a':'1px solid #ddd', background: idType==="Passport"?'#dcfce7':'white', fontWeight: '700'}}>Passport</button>
          </div>
          <input value={idInput} onChange={e=>setIdInput(e.target.value)} placeholder={idType==="ID"?"13-digit e.g. 9901015000087":"A12345678"} style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '16px'}} />
          <button onClick={handleVerify} style={{width: '100%', background: '#16a34a', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: '800', marginTop: '16px', cursor: 'pointer'}}>Verify & Continue →</button>
        </div>
      </div>
    )
  }

  // --- 3B. MAIN APP (Citizen or Admin) ---
  const isAdmin = page === "admin"
  return (
    <div style={{fontFamily: 'system-ui', background: '#f8fafc', minHeight: '100vh'}}>
      <div style={{background: 'white', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
        <span style={{fontWeight: '800'}}>ZA • UBUNTU <span style={{color: '#16a34a'}}>Civic-Connect</span> {isAdmin ? '(GOV)' : '(Citizen)'}</span>
        <div style={{display: 'flex', gap: '8px'}}>
          <button onClick={()=>setPage("portals")} style={{background: '#eee', border: 'none', padding: '8px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px'}}>Portals</button>
          <button onClick={()=>setPage("welcome")} style={{background: '#111', color: 'white', padding: '8px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px'}}>Home</button>
        </div>
      </div>

      <main style={{maxWidth: '900px', margin: '0 auto', padding: '24px'}}>
        <div style={{background: isAdmin ? '#111' : 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', padding: '24px', borderRadius: '16px', marginBottom: '20px'}}>
          <h2 style={{fontSize: '28px', fontWeight: '900'}}>{isAdmin ? 'Government Dashboard' : 'Citizen Dashboard'}</h2>
          <p style={{fontSize: '12px', marginTop: '6px', opacity: 0.8}}>📅 {new Date().toLocaleString()} {verifiedID ? `• ID: ${verifiedID.substring(0,6)}****` : ''}</p>
        </div>

        {!isAdmin && (
          <div style={{background: 'white', padding: '16px', borderRadius: '12px', marginBottom: '20px', display: 'flex', gap: '8px'}}>
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Issue" style={{flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd'}} />
            <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Location" style={{padding: '10px', borderRadius: '8px', border: '1px solid #ddd'}} />
            <button onClick={addIssue} style={{background: '#16a34a', color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '700'}}>Report</button>
          </div>
        )}

        <div style={{display: 'grid', gap: '12px'}}>
          {issues.map(issue=>(
            <div key={issue.id} style={{background: 'white', padding: '14px', borderRadius: '10px', borderLeft: `5px solid ${issue.status==='Fixed'?'#16a34a':issue.status==='In Progress'?'#f59e0b':'#3b82f6'}`}}>
              <div style={{display: 'flex', justifyContent: 'space-between'}}><b>{issue.title}</b><span style={{fontSize: '11px', background: '#eee', padding: '4px 8px', borderRadius: '10px'}}>{issue.status}</span></div>
              <p style={{fontSize: '12px', color: '#555'}}>📍{issue.location} • {issue.date}</p>
              <div style={{display: 'flex', gap: '4px', marginTop: '8px', fontSize: '10px'}}><span style={{background: '#111', color: 'white', padding: '3px 6px', borderRadius: '4px'}}>Reported</span>→<span style={{background: issue.status!=='Reported'?'#111':'#eee', color: issue.status!=='Reported'?'white':'#666', padding: '3px 6px', borderRadius: '4px'}}>In Progress</span>→<span style={{background: issue.status==='Fixed'?'#16a34a':'#eee', color: issue.status==='Fixed'?'white':'#666', padding: '3px 6px', borderRadius: '4px'}}>Fixed</span></div>
              {issue.meeting && <div style={{marginTop: '8px', background: '#fffbeb', padding: '8px', borderRadius: '8px', fontSize: '12px', border: '1px dashed #f59e0b'}}>🏛️ Meeting: {issue.meeting.date} {issue.meeting.time} @ {issue.meeting.place}</div>}
              {isAdmin && <button onClick={()=>setShowMeetingModal(issue.id)} style={{marginTop: '8px', fontSize: '12px', background: '#111', color: 'white', padding: '6px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer'}}>📅 Schedule Meeting</button>}
            </div>
          ))}
        </div>

        {showMeetingModal && (
          <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'}}>
            <div style={{background: 'white', padding: '20px', borderRadius: '12px', width: '100%', maxWidth: '350px'}}>
              <h3 style={{fontWeight: '800'}}>Schedule Meeting</h3>
              <input type="date" value={meetingDate} onChange={e=>setMeetingDate(e.target.value)} style={{width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', marginTop: '10px'}} />
              <input type="time" value={meetingTime} onChange={e=>setMeetingTime(e.target.value)} style={{width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', marginTop: '8px'}} />
              <input value={meetingPlace} onChange={e=>setMeetingPlace(e.target.value)} style={{width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', marginTop: '8px'}} />
              <div style={{display: 'flex', gap: '8px', marginTop: '12px'}}>
                <button onClick={()=>scheduleMeeting(showMeetingModal)} style={{flex: 1, background: '#16a34a', color: 'white', padding: '10px', borderRadius: '8px', border: 'none'}}>Send</button>
                <button onClick={()=>setShowMeetingModal(null)} style={{flex: 1, background: '#eee', padding: '10px', borderRadius: '8px', border: 'none'}}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}