import { createClient } from '@supabase/supabase-js'

let cachedOwnerUserId: string | null = null

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function createServerClient() {
  const supabaseUrl = requiredEnv('NEXT_PUBLIC_SUPABASE_URL')
  const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY')

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export async function getServerSupabaseContext() {
  const supabase = createServerClient()

  if (cachedOwnerUserId) {
    return { supabase, ownerUserId: cachedOwnerUserId }
  }

  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1,
  })

  if (listError) {
    throw listError
  }

  let ownerUserId = usersData.users[0]?.id

  if (!ownerUserId) {
    const seedEmail = `owner-${Date.now()}@local.invalid`
    const seedPassword = `Owner-${Date.now()}-Aa1!`

    const { data: createdUserData, error: createUserError } = await supabase.auth.admin.createUser({
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
  return { supabase, ownerUserId }
}
