import { useState, useEffect } from 'react'
import { supabase } from '../supabase.js'

export default function UserProfile({ user, onBack }) {
  const [profile, setProfile] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({ fullName: '', phone: '', avatar_url: '' })
  const [stats, setStats] = useState({ reportCount: 0, resolvedCount: 0, memberSince: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
    fetchStats()
  }, [user])

  async function fetchProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (data) {
      setProfile(data)
      setEditData({ fullName: data.full_name, phone: data.phone, avatar_url: data.avatar_url })
    }
    setLoading(false)
  }

  async function fetchStats() {
    const { count: reportCount } = await supabase
      .from('reports')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
    
    const { count: resolvedCount } = await supabase
      .from('reports')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('status', 'fixed')
    
    setStats({
      reportCount: reportCount || 0,
      resolvedCount: resolvedCount || 0,
      memberSince: profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : ''
    })
  }

  async function updateProfile() {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: editData.fullName,
        phone: editData.phone,
        avatar_url: editData.avatar_url
      })
      .eq('user_id', user.id)
    
    if (!error) {
      fetchProfile()
      setIsEditing(false)
    }
  }

  if (loading) return <div style={{ padding: 20, textAlign: 'center' }}>Loading profile...</div>

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
      <button onClick={onBack} style={{ marginBottom: 15, padding: '8px 16px', background: 'none', border: '1px solid #000', borderRadius: 6, cursor: 'pointer' }}>← Back</button>

      <div style={{ background: '#fff', padding: 30, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{
            width: 100, height: 100, borderRadius: '50%', background: '#f0f0f0',
            margin: '0 auto 15px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 40, border: '2px solid #000'
          }}>
            {editData.avatar_url ? <img src={editData.avatar_url} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : '👤'}
          </div>
          <h2>{editData.fullName || 'User'}</h2>
          <p style={{ color: '#666', margin: '5px 0' }}>{user.email}</p>
        </div>

        {!isEditing ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: '#f5f5f5', padding: 15, borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 5 }}>REPORTS FILED</div>
                <div style={{ fontSize: 24, fontWeight: 'bold' }}>{stats.reportCount}</div>
              </div>
              <div style={{ background: '#f5f5f5', padding: 15, borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 5 }}>RESOLVED</div>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#4caf50' }}>{stats.resolvedCount}</div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 5 }}>PHONE</div>
              <div>{editData.phone || 'Not set'}</div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 5 }}>MEMBER SINCE</div>
              <div>{stats.memberSince || 'Recently'}</div>
            </div>

            <button onClick={() => setIsEditing(true)} style={{ width: '100%', padding: 12, background: '#000', color: '#ffd700', border: 0, borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}>✏️ EDIT PROFILE</button>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 15 }}>
              <label style={{ fontWeight: 'bold', fontSize: 12 }}>FULL NAME</label>
              <input value={editData.fullName} onChange={e => setEditData({ ...editData, fullName: e.target.value })} style={{ width: '100%', padding: 10, marginTop: 5, borderRadius: 6, border: '1px solid #ccc' }} />
            </div>

            <div style={{ marginBottom: 15 }}>
              <label style={{ fontWeight: 'bold', fontSize: 12 }}>PHONE</label>
              <input value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} style={{ width: '100%', padding: 10, marginTop: 5, borderRadius: 6, border: '1px solid #ccc' }} />
            </div>

            <div style={{ marginBottom: 15 }}>
              <label style={{ fontWeight: 'bold', fontSize: 12 }}>AVATAR URL</label>
              <input value={editData.avatar_url} onChange={e => setEditData({ ...editData, avatar_url: e.target.value })} placeholder="https://..." style={{ width: '100%', padding: 10, marginTop: 5, borderRadius: 6, border: '1px solid #ccc' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={updateProfile} style={{ padding: 12, background: '#4caf50', color: '#fff', border: 0, borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}>Save</button>
              <button onClick={() => setIsEditing(false)} style={{ padding: 12, background: '#f0f0f0', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
