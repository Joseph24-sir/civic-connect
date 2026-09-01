import { useEffect, useState } from 'react'
import { supabase } from '../supabase.js'

export default function NotificationBell({ user }) {
  const [notifs, setNotifs] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) return

    fetchNotifications()

    const subscription = supabase
      .channel(`notifications:user_id=eq.${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
        setNotifs(n => [payload.new, ...n])
        setUnreadCount(c => c + 1)
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }, [user])

  async function fetchNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(10)

    setNotifs(data || [])
    setUnreadCount(data?.filter(n => !n.read).length || 0)
  }

  async function markAsRead(id) {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)

    setNotifs(n => n.map(notif => notif.id === id ? { ...notif, read: true } : notif))
    setUnreadCount(c => Math.max(0, c - 1))
  }

  async function clearAll() {
    await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user?.id)

    setNotifs([])
    setUnreadCount(0)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          fontSize: 20,
          cursor: 'pointer',
          padding: 8
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: 0,
            right: 0,
            background: '#ff5252',
            color: '#fff',
            borderRadius: '50%',
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 'bold'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          width: 350,
          background: '#fff',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          marginTop: 10
        }}>
          <div style={{
            padding: 12,
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: 'bold'
          }}>
            Notifications
            {notifs.length > 0 && (
              <button
                onClick={clearAll}
                style={{
                  fontSize: 11,
                  background: '#f0f0f0',
                  border: 'none',
                  borderRadius: 4,
                  padding: '4px 8px',
                  cursor: 'pointer'
                }}
              >
                Clear All
              </button>
            )}
          </div>

          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {notifs.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#999', fontSize: 12 }}>
                No notifications yet
              </div>
            ) : (
              notifs.map(n => (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  style={{
                    padding: 12,
                    borderBottom: '1px solid #f0f0f0',
                    background: n.read ? '#fff' : '#f9f9f9',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ fontSize: 16 }}>
                      {n.type === 'update' ? '📋' : n.type === 'resolved' ? '✅' : '🔔'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 3 }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: 11, color: '#666', marginBottom: 5 }}>
                        {n.message}
                      </div>
                      <small style={{ color: '#999' }}>
                        {new Date(n.created_at).toLocaleString()}
                      </small>
                    </div>
                    {!n.read && (
                      <div style={{
                        width: 8,
                        height: 8,
                        background: '#2196f3',
                        borderRadius: '50%',
                        marginTop: 3
                      }} />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
