import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSupabaseContext } from '@/lib/server-supabase'

const categoriesSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['product', 'expense']),
})

export async function GET() {
  try {
    const { supabase, ownerUserId } = await getServerSupabaseContext()

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .order('name', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = categoriesSchema.parse(body)
    const { supabase, ownerUserId } = await getServerSupabaseContext()

    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: validatedData.name,
        type: validatedData.type,
        owner_user_id: ownerUserId,
      })
      .select()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
