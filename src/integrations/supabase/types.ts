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
      bookings: {
        Row: {
          created_at: string
          eid_back_url: string | null
          eid_front_url: string | null
          email: string
          id: string
          name: string
          passport_url: string | null
          phone: string
          updated_at: string
          worker_photo_url: string | null
        }
        Insert: {
          created_at?: string
          eid_back_url?: string | null
          eid_front_url?: string | null
          email: string
          id?: string
          name: string
          passport_url?: string | null
          phone: string
          updated_at?: string
          worker_photo_url?: string | null
        }
        Update: {
          created_at?: string
          eid_back_url?: string | null
          eid_front_url?: string | null
          email?: string
          id?: string
          name?: string
          passport_url?: string | null
          phone?: string
          updated_at?: string
          worker_photo_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      submissions: {
        Row: {
          addons: string[] | null
          created_at: string | null
          dewa_bill_url: string | null
          email: string
          emirates_id_url: string | null
          id: string
          installment_plan: boolean | null
          maid_passport_url: string | null
          maid_photo_url: string | null
          maid_visa_url: string | null
          medical_insurance: boolean | null
          name: string
          notes: string | null
          package: string
          phone: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          addons?: string[] | null
          created_at?: string | null
          dewa_bill_url?: string | null
          email: string
          emirates_id_url?: string | null
          id?: string
          installment_plan?: boolean | null
          maid_passport_url?: string | null
          maid_photo_url?: string | null
          maid_visa_url?: string | null
          medical_insurance?: boolean | null
          name: string
          notes?: string | null
          package: string
          phone: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          addons?: string[] | null
          created_at?: string | null
          dewa_bill_url?: string | null
          email?: string
          emirates_id_url?: string | null
          id?: string
          installment_plan?: boolean | null
          maid_passport_url?: string | null
          maid_photo_url?: string | null
          maid_visa_url?: string | null
          medical_insurance?: boolean | null
          name?: string
          notes?: string | null
          package?: string
          phone?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      workers: {
        Row: {
          age: number
          center_ref: string | null
          children: number | null
          created_at: string | null
          education: Json | null
          employer_count: number | null
          employers: Json | null
          experience: Json | null
          files: Json | null
          financials: Json | null
          height_cm: number | null
          id: string
          job1: string
          job2: string | null
          languages: Json | null
          maid_status: string
          marital_status: string
          name: string
          nationality_code: string
          passport_expiry: string
          passport_no: string
          religion: string
          salary: number | null
          skills: Json | null
          status: string | null
          updated_at: string | null
          visa: Json | null
          weight_kg: number | null
        }
        Insert: {
          age: number
          center_ref?: string | null
          children?: number | null
          created_at?: string | null
          education?: Json | null
          employer_count?: number | null
          employers?: Json | null
          experience?: Json | null
          files?: Json | null
          financials?: Json | null
          height_cm?: number | null
          id?: string
          job1: string
          job2?: string | null
          languages?: Json | null
          maid_status: string
          marital_status: string
          name: string
          nationality_code: string
          passport_expiry: string
          passport_no: string
          religion: string
          salary?: number | null
          skills?: Json | null
          status?: string | null
          updated_at?: string | null
          visa?: Json | null
          weight_kg?: number | null
        }
        Update: {
          age?: number
          center_ref?: string | null
          children?: number | null
          created_at?: string | null
          education?: Json | null
          employer_count?: number | null
          employers?: Json | null
          experience?: Json | null
          files?: Json | null
          financials?: Json | null
          height_cm?: number | null
          id?: string
          job1?: string
          job2?: string | null
          languages?: Json | null
          maid_status?: string
          marital_status?: string
          name?: string
          nationality_code?: string
          passport_expiry?: string
          passport_no?: string
          religion?: string
          salary?: number | null
          skills?: Json | null
          status?: string | null
          updated_at?: string | null
          visa?: Json | null
          weight_kg?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
