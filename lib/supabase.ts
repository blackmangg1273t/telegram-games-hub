import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: number
          telegram_id: number
          username: string | null
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          total_score: number
          games_played: number
          games_won: number
          created_at: string
          last_seen: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      rooms: {
        Row: {
          id: string
          code: string
          host_telegram_id: number
          game_type: string
          status: string
          is_public: boolean
          max_players: number
          current_round: number
          total_rounds: number
          game_data: Record<string, unknown>
          created_at: string
          updated_at: string
        }
      }
      room_members: {
        Row: {
          id: number
          room_id: string
          telegram_id: number
          score: number
          is_ready: boolean
          joined_at: string
        }
      }
    }
  }
}
