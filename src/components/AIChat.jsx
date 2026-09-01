import { useState, useRef, useEffect } from 'react'

export default function AIChat({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hello! 👋 I\'m your civic engagement assistant. I can help you:\n• File a new report\n• Track existing reports\n• Answer questions about the platform\n\nHow can I assist you today?' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim()) return

    const userMessage = input.trim()
    setInput('')
    setMessages(m => [...m, { type: 'user', text: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(m => [...m, { type: 'bot', text: data.reply }])
      } else {
        const botReply = generateLocalResponse(userMessage)
        setMessages(m => [...m, { type: 'bot', text: botReply }])
      }
    } catch (error) {
      const botReply = generateLocalResponse(userMessage)
      setMessages(m => [...m, { type: 'bot', text: botReply }])
    }

    setIsLoading(false)
  }

  function generateLocalResponse(userInput) {
    const lower = userInput.toLowerCase()

    if (lower.includes('report') && lower.includes('file')) {
      return '📝 To file a report:\n1. Click the "File New Report" button\n2. Select your main category (Water, Electricity, etc.)\n3. Fill in the location and details\n4. Add photos if possible\n5. Submit!\n\nWould you like help with anything specific?'
    }

    if (lower.includes('track') || lower.includes('check')) {
      return '📍 To track your reports:\n1. Go to "View Reports"\n2. Use filters to find your report\n3. Click on it to see details and updates\n4. You\'ll get notifications when status changes\n\nNeed anything else?'
    }

    if (lower.includes('urgent') || lower.includes('critical')) {
      return '🚨 For urgent issues (power outages, fires, safety):\n• Mark urgency as "Critical"\n• Include exact location\n• Add contact number\n• Include photos if safe\n\nOur team prioritizes critical reports!'
    }

    if (lower.includes('profile') || lower.includes('account')) {
      return '👤 You can manage your profile by:\n• Clicking your name in the top right\n• Viewing your report history\n• Updating your contact info\n• Checking your impact stats\n\nAnything else?'
    }

    if (lower.includes('help') || lower.includes('how')) {
      return '💡 I can help with:\n• Filing new reports\n• Tracking report status\n• Finding reports in your area\n• Understanding urgency levels\n• General platform questions\n\nWhat would you like to know?'
    }

    return '🤔 I\'m not sure about that. Try asking about:\n• How to file a report\n• How to track reports\n• Urgency levels\n• Your profile\n• Or anything else civic-related!'
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      width: 350,
      height: 500,
      background: '#fff',
      borderRadius: 12,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      border: '2px solid #000'
    }}>
      <div style={{ background: '#000', color: '#ffd700', padding: 15, borderRadius: '12px 12px 0 0', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>🤖 AI Assistant</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#ffd700', fontSize: 18, cursor: 'pointer' }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 15, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.type === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              background: msg.type === 'user' ? '#000' : '#f0f0f0',
              color: msg.type === 'user' ? '#ffd700' : '#000',
              padding: 10,
              borderRadius: 8,
              fontSize: 12,
              lineHeight: 1.4,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {msg.text}
          </div>
        ))}
        {isLoading && <div style={{ alignSelf: 'flex-start', color: '#999', fontSize: 12 }}>AI is thinking...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: 12, borderTop: '1px solid #eee', display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && sendMessage()}
          placeholder="Ask me anything..."
          style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #ddd', fontSize: 12 }}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          style={{
            padding: '8px 12px',
            background: '#000',
            color: '#ffd700',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: 12
          }}
        >
          →
        </button>
      </div>
    </div>
  )
}
