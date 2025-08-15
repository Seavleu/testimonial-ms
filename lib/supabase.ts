import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const createClient = () => createClientComponentClient()


export type Database = {
  public: {
    Tables: {
      testimonials: {
        Row: {
          id: string
          user_id: string
          name: string
          text: string
          video_url: string | null
          approved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          text: string
          video_url?: string | null
          approved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          text?: string
          video_url?: string | null
          approved?: boolean
          created_at?: string
        }
      }
    }
  }
}