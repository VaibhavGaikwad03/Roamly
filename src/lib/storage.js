// Places persistence — Supabase-backed, per account.
//
// This module is the data seam: the app calls loadPlaces / insertPlace /
// updatePlace / deletePlace and never touches the client directly. Row-Level
// Security scopes every query to the signed-in user, so there is no user_id to
// pass around on reads.
import { supabase } from './supabase.js'

// DB row (snake_case) → app shape (camelCase-ish used across components).
function fromRow(r) {
  return {
    id: r.id,
    name: r.name,
    address: r.address || '',
    category: r.category || 'city',
    status: r.status || 'want',
    notes: r.notes || '',
    lat: r.lat,
    lng: r.lng,
    createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
  }
}

// App draft → DB columns. user_id is filled from the session by insertPlace.
function toRow(p) {
  return {
    name: p.name,
    address: p.address || null,
    category: p.category || null,
    status: p.status || 'want',
    notes: p.notes || null,
    lat: typeof p.lat === 'number' ? p.lat : null,
    lng: typeof p.lng === 'number' ? p.lng : null,
  }
}

export async function loadPlaces() {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(fromRow)
}

export async function insertPlace(draft) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in.')

  const { data, error } = await supabase
    .from('places')
    .insert({ ...toRow(draft), user_id: user.id })
    .select()
    .single()
  if (error) throw error
  return fromRow(data)
}

export async function updatePlace(id, patch) {
  const { data, error } = await supabase
    .from('places')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return fromRow(data)
}

export async function deletePlace(id) {
  const { error } = await supabase.from('places').delete().eq('id', id)
  if (error) throw error
}

// Kept for callers that still want a client-side id (e.g. optimistic UI).
export function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}
