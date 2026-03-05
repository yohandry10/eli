import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSupabaseContext } from '@/lib/server-supabase'

const updateSchema = z.object({
  date: z.string().optional(),
  category_id: z.string().optional(),
  type: z.enum(['materials', 'operating']).optional(),
  amount: z.number().positive().optional(),
  supplier: z.string().optional(),
  description: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updateSchema.parse(body)
    const { supabase, ownerUserId } = await getServerSupabaseContext()

    const updateData: Record<string, unknown> = { ...validatedData }
    if (updateData.date !== undefined) {
      updateData.expense_date = updateData.date
      delete updateData.date
    }
    if (updateData.type !== undefined) {
      updateData.expense_type = updateData.type
      delete updateData.type
    }
    if (updateData.description !== undefined) {
      updateData.notes = updateData.description
      delete updateData.description
    }

    const { data, error } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', id)
      .eq('owner_user_id', ownerUserId)
      .select()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Expense not found or unauthorized' },
        { status: 404 }
      )
    }

    return NextResponse.json(data[0])
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { supabase, ownerUserId } = await getServerSupabaseContext()

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('owner_user_id', ownerUserId)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Expense deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
