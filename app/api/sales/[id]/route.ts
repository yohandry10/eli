import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSupabaseContext } from '@/lib/server-supabase'

const updateSchema = z.object({
  date: z.string().optional(),
  product_id: z.string().optional(),
  quantity: z.number().positive().optional(),
  unit_price: z.number().positive().optional(),
  payment_method_id: z.string().optional(),
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
      updateData.sale_date = updateData.date
      delete updateData.date
    }

    if (validatedData.quantity && validatedData.unit_price) {
      updateData.total_amount = validatedData.quantity * validatedData.unit_price
    }

    const { data, error } = await supabase
      .from('sales')
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
        { error: 'Sale not found or unauthorized' },
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
      .from('sales')
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
      { message: 'Sale deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
