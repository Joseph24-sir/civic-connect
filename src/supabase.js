import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export async function hashID(id){
  const encoder = new TextEncoder()
  const data = encoder.encode(id)
  const b = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')
}