export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          color: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          user_id?: string
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          amount: number
          description: string | null
          date: string
          category_id: string | null
          payment_method: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          amount: number
          description?: string | null
          date?: string
          category_id?: string | null
          payment_method: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          amount?: number
          description?: string | null
          date?: string
          category_id?: string | null
          payment_method?: string
          user_id?: string
          created_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          amount: number
          category_id: string
          user_id: string
          month: string
          created_at: string
        }
        Insert: {
          id?: string
          amount: number
          category_id: string
          user_id: string
          month: string
          created_at?: string
        }
        Update: {
          id?: string
          amount?: number
          category_id?: string
          user_id?: string
          month?: string
          created_at?: string
        }
      }
      receipts: {
        Row: {
          id: string
          expense_id: string
          url: string
          uploaded_at: string
        }
        Insert: {
          id?: string
          expense_id: string
          url: string
          uploaded_at?: string
        }
        Update: {
          id?: string
          expense_id?: string
          url?: string
          uploaded_at?: string
        }
      }
    }
  }
}