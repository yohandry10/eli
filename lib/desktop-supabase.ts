import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _adminSupabase: SupabaseClient | null = null

export function getAdminSupabase(): SupabaseClient {
  if (!_adminSupabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
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

  const adminSupabase = getAdminSupabase()
  const { data: usersData, error: listError } = await adminSupabase.auth.admin.listUsers({
    page: 1,
    perPage: 1,
  })

  if (listError) throw listError

  let ownerUserId = usersData.users[0]?.id

  if (!ownerUserId) {
    const seedEmail = `owner-${Date.now()}@local.invalid`
    const seedPassword = `Owner-${Date.now()}-Aa1!`
    const { data: createdUserData, error: createUserError } = await adminSupabase.auth.admin.createUser({
      email: seedEmail,
      password: seedPassword,
      email_confirm: true,
    })
    if (createUserError || !createdUserData.user?.id) {
      throw createUserError ?? new Error('Failed to create owner user')
    }
    ownerUserId = createdUserData.user.id
  }

  cachedOwnerUserId = ownerUserId
  return ownerUserId
}
