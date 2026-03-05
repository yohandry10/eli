import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSupabaseContext } from '@/lib/server-supabase'

const productsSchema = z.object({
  name: z.string().min(1),
  category_id: z.string().optional(),
  default_price: z.number().min(0),
  is_active: z.boolean().optional().default(true),
})

export async function GET() {
  try {
    const { supabase, ownerUserId } = await getServerSupabaseContext()

    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
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
    const validatedData = productsSchema.parse(body)
    const { supabase, ownerUserId } = await getServerSupabaseContext()

    let categoryId = validatedData.category_id

    // Si no enviaron categoría, buscar o crear una por defecto
    if (!categoryId || categoryId === '') {
      // Intentar obtener "General" existente
      const { data: existingCat } = await supabase
        .from('categories')
        .select('id')
        .eq('owner_user_id', ownerUserId)
        .eq('name', 'General')
        .maybeSingle()

      if (existingCat) {
        categoryId = existingCat.id
      } else {
        // Crear "General" automáticamente
        const { data: newCat, error: catError } = await supabase
          .from('categories')
          .insert({ name: 'General', type: 'product', owner_user_id: ownerUserId })
          .select('id')
          .single()

        if (catError || !newCat) {
          return NextResponse.json(
            { error: 'No se pudo asignar categoría: ' + catError?.message },
            { status: 400 }
          )
        }
        categoryId = newCat.id
      }
    }

    const insertData: any = {
      name: validatedData.name,
      default_price: validatedData.default_price,
      is_active: validatedData.is_active,
      owner_user_id: ownerUserId,
      category_id: categoryId // Usamos el ID final (enviado o autogenerado)
    }

    const { data, error } = await supabase
      .from('products')
      .insert(insertData)
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
