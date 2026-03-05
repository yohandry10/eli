import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSupabaseContext } from '@/lib/server-supabase'

const expensesSchema = z.object({
  date: z.string(),
  category_id: z.string(),
  type: z.enum(['materials', 'operating']),
  amount: z.number().positive(),
  supplier: z.string().min(1),
  description: z.string().optional(),
})

export async function GET() {
  try {
    const { supabase, ownerUserId } = await getServerSupabaseContext()

    const { data, error } = await supabase
      .from('expenses')
      .select('*, categories(name)')
      .eq('owner_user_id', ownerUserId)
      .order('expense_date', { ascending: false })

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
    const validatedData = expensesSchema.parse(body)
    const { supabase, ownerUserId } = await getServerSupabaseContext()

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        expense_date: validatedData.date,
        category_id: validatedData.category_id,
        expense_type: validatedData.type,
        amount: validatedData.amount,
        supplier: validatedData.supplier,
        notes: validatedData.description || null,
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
