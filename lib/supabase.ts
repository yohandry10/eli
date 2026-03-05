import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          owner_user_id: string
          name: string
          type: 'product' | 'expense'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['categories']['Row']>
      }
      payment_methods: {
        Row: {
          id: string
          owner_user_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['payment_methods']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['payment_methods']['Row']>
      }
      products: {
        Row: {
          id: string
          owner_user_id: string
          name: string
          category_id: string
          default_price: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['products']['Row']>
      }
      sales: {
        Row: {
          id: string
          owner_user_id: string
          product_id: string
          payment_method_id: string
          quantity: number
          unit_price: number
          total_amount: number
          sale_date: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['sales']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['sales']['Row']>
      }
      expenses: {
        Row: {
          id: string
          owner_user_id: string
          category_id: string
          amount: number
          expense_type: 'materials' | 'operating'
          supplier: string
          expense_date: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['expenses']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['expenses']['Row']>
      }
    }
  }
}
