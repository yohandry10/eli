import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _adminSupabase: SupabaseClient | null = null

export function getAdminSupabase(): SupabaseClient {
  if (!_adminSupabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey =
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Faltan variables de Supabase (NEXT_PUBLIC_SUPABASE_URL / KEY)')
    }
    _adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }
  return _adminSupabase
}

let cachedOwnerUserId: string | null = null

export async function getOwnerUserId(): Promise<string> {
  if (cachedOwnerUserId) return cachedOwnerUserId

  const envOwnerUserId = process.env.NEXT_PUBLIC_OWNER_USER_ID?.trim()
  if (envOwnerUserId) {
    cachedOwnerUserId = envOwnerUserId
    return envOwnerUserId
  }

  const adminSupabase = getAdminSupabase()

  const ownerCandidates = await Promise.all([
    adminSupabase.from('sales').select('owner_user_id').limit(1).maybeSingle(),
    adminSupabase.from('expenses').select('owner_user_id').limit(1).maybeSingle(),
    adminSupabase.from('products').select('owner_user_id').limit(1).maybeSingle(),
    adminSupabase.from('categories').select('owner_user_id').limit(1).maybeSingle(),
    adminSupabase.from('payment_methods').select('owner_user_id').limit(1).maybeSingle(),
  ])

  for (const candidate of ownerCandidates) {
    const ownerId = candidate.data?.owner_user_id
    if (!candidate.error && ownerId) {
      cachedOwnerUserId = ownerId
      return ownerId
    }
  }

  throw new Error('No se pudo resolver owner_user_id. Configura NEXT_PUBLIC_OWNER_USER_ID.')
}
