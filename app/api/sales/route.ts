import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSupabaseContext } from '@/lib/server-supabase'

const salesSchema = z.object({
  date: z.string(),
  product_id: z.string(),
  quantity: z.number().positive(),
  unit_price: z.number().min(0),
  payment_method_id: z.string(),
})

export async function GET() {
  try {
    const { supabase, ownerUserId } = await getServerSupabaseContext()

    const { data, error } = await supabase
      .from('sales')
      .select('*, products(name), payment_methods(name)')
      .eq('owner_user_id', ownerUserId)
      .order('sale_date', { ascending: false })

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
    const validatedData = salesSchema.parse(body)
    const { supabase, ownerUserId } = await getServerSupabaseContext()

    const totalAmount = validatedData.quantity * validatedData.unit_price

    const { data, error } = await supabase
      .from('sales')
      .insert({
        sale_date: validatedData.date,
        product_id: validatedData.product_id,
        quantity: validatedData.quantity,
        unit_price: validatedData.unit_price,
        total_amount: totalAmount,
        payment_method_id: validatedData.payment_method_id,
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
