import { useState, useEffect } from 'react'
import { supabase } from '../supabase.js'

export default function ReportComments({ reportId, user }) {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchComments()
    
    const subscription = supabase
      .channel(`comments:report_id=eq.${reportId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'report_comments', filter: `report_id=eq.${reportId}` }, (payload) => {
        setComments(c => [...c, payload.new])
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }, [reportId])

  async function fetchComments() {
    const { data } = await supabase
      .from('report_comments')
      .select('*, profiles(full_name, avatar_url)')
      .eq('report_id', reportId)
      .order('created_at', { ascending: true })
    
    setComments(data || [])
    setLoading(false)
  }

  async function submitComment() {
    if (!newComment.trim()) return

    const { error } = await supabase
      .from('report_comments')
      .insert({
        report_id: reportId,
        user_id: user.id,
        content: newComment
      })

    if (!error) {
      setNewComment('')
      fetchComments()
    }
  }

  if (loading) return <div style={{ fontSize: 12, color: '#999' }}>Loading comments...</div>

  return (
    <div style={{ marginTop: 20, borderTop: '1px solid #eee', paddingTop: 15 }}>
      <h4 style={{ marginBottom: 15, fontSize: 14 }}>💬 COMMENTS ({comments.length})</h4>

      <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 15 }}>
        {comments.map(c => (
          <div key={c.id} style={{ background: '#f9f9f9', padding: 10, borderRadius: 6, marginBottom: 10, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <strong>{c.profiles?.full_name || 'Anonymous'}</strong>
              <small style={{ color: '#999' }}>{new Date(c.created_at).toLocaleString()}</small>
            </div>
            <p style={{ margin: 0 }}>{c.content}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <textarea
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          style={{ flex: 1, padding: 10, borderRadius: 6, border: '1px solid #ddd', minHeight: 60, fontFamily: 'inherit', fontSize: 12 }}
        />
        <button
          onClick={submitComment}
          disabled={!newComment.trim()}
          style={{
            padding: '10px 15px',
            background: newComment.trim() ? '#000' : '#ccc',
            color: '#ffd700',
            border: 0,
            borderRadius: 6,
            cursor: newComment.trim() ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
            whiteSpace: 'nowrap'
          }}
        >
          Post
        </button>
      </div>
    </div>
  )
}
