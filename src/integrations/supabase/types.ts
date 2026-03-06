export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      analysis_counter: {
        Row: {
          count: number
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          count?: number
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          count?: number
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      analysis_logs: {
        Row: {
          age: number | null
          city: string | null
          created_at: string | null
          gender: string | null
          id: string
          partner_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          age?: number | null
          city?: string | null
          created_at?: string | null
          gender?: string | null
          id?: string
          partner_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          age?: number | null
          city?: string | null
          created_at?: string | null
          gender?: string | null
          id?: string
          partner_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_logs_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_subscriptions: {
        Row: {
          activated_at: string
          activated_by: string | null
          analyses_limit: number
          analyses_used: number
          created_at: string
          id: string
          is_active: boolean
          partner_id: string
          plan_type: string
          price: number
          requested_plan: string | null
        }
        Insert: {
          activated_at?: string
          activated_by?: string | null
          analyses_limit?: number
          analyses_used?: number
          created_at?: string
          id?: string
          is_active?: boolean
          partner_id: string
          plan_type?: string
          price?: number
          requested_plan?: string | null
        }
        Update: {
          activated_at?: string
          activated_by?: string | null
          analyses_limit?: number
          analyses_used?: number
          created_at?: string
          id?: string
          is_active?: boolean
          partner_id?: string
          plan_type?: string
          price?: number
          requested_plan?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_subscriptions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          slug: string
          user_id: string
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          slug: string
          user_id: string
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          slug?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_history: {
        Row: {
          action: string
          admin_id: string | null
          analyses_limit: number
          created_at: string
          id: string
          partner_id: string
          plan_type: string
          price: number
        }
        Insert: {
          action: string
          admin_id?: string | null
          analyses_limit: number
          created_at?: string
          id?: string
          partner_id: string
          plan_type: string
          price: number
        }
        Update: {
          action?: string
          admin_id?: string | null
          analyses_limit?: number
          created_at?: string
          id?: string
          partner_id?: string
          plan_type?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "subscription_history_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_users: {
        Row: {
          created_at: string | null
          first_name: string | null
          id: string
          last_login: string | null
          last_name: string | null
          photo_url: string | null
          telegram_id: string
          username: string | null
        }
        Insert: {
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_login?: string | null
          last_name?: string | null
          photo_url?: string | null
          telegram_id: string
          username?: string | null
        }
        Update: {
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_login?: string | null
          last_name?: string | null
          photo_url?: string | null
          telegram_id?: string
          username?: string | null
        }
        Relationships: []
      }
      user_analyses: {
        Row: {
          age: number | null
          created_at: string | null
          full_result: string | null
          gender: string | null
          id: string
          result_summary: string | null
          study_type: string | null
          telegram_id: string
        }
        Insert: {
          age?: number | null
          created_at?: string | null
          full_result?: string | null
          gender?: string | null
          id?: string
          result_summary?: string | null
          study_type?: string | null
          telegram_id: string
        }
        Update: {
          age?: number | null
          created_at?: string | null
          full_result?: string | null
          gender?: string | null
          id?: string
          result_summary?: string | null
          study_type?: string | null
          telegram_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_analyses_telegram_id_fkey"
            columns: ["telegram_id"]
            isOneToOne: false
            referencedRelation: "telegram_users"
            referencedColumns: ["telegram_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visits: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          partner_id: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          partner_id?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          partner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visits_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_partner_limit: { Args: { p_partner_id: string }; Returns: boolean }
      get_analysis_stats: {
        Args: never
        Returns: {
          avg_age: number
          critical_count: number
          female_count: number
          male_count: number
          normal_count: number
          today_analyses: number
          top_cities: Json
          total_analyses: number
          total_visits: number
          visits_last_30_days: number
          warning_count: number
        }[]
      }
      get_partner_stats: {
        Args: { p_partner_id: string }
        Returns: {
          avg_age: number
          critical_count: number
          female_count: number
          male_count: number
          normal_count: number
          today_analyses: number
          top_cities: Json
          total_analyses: number
          total_visits: number
          visits_last_30_days: number
          warning_count: number
        }[]
      }
      get_partner_subscription: {
        Args: { p_partner_id: string }
        Returns: {
          activated_at: string
          analyses_limit: number
          analyses_used: number
          is_active: boolean
          plan_type: string
          price: number
          requested_plan: string
        }[]
      }
      get_partner_visits_by_day: {
        Args: { p_partner_id: string }
        Returns: {
          visit_count: number
          visit_date: string
        }[]
      }
      get_visits_by_day: {
        Args: never
        Returns: {
          visit_count: number
          visit_date: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_analysis_counter: { Args: never; Returns: number }
      increment_partner_usage: {
        Args: { p_partner_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user" | "partner"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "partner"],
    },
  },
} as const
