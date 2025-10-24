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
      lead_activities: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          id: string
          lead_id: string
          metadata: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description?: string | null
          id?: string
          lead_id: string
          metadata?: Json | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          id?: string
          lead_id?: string
          metadata?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          client_converted: boolean | null
          client_name: string | null
          created_at: string
          eid_back_url: string | null
          eid_front_url: string | null
          email: string | null
          emirate: string | null
          id: string
          lead_source: string | null
          mobile_number: string
          nationality_code: string | null
          passport_copy_url: string | null
          remind_me: string | null
          service_required: string | null
          status: Database["public"]["Enums"]["lead_status"]
          submission_id: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          client_converted?: boolean | null
          client_name?: string | null
          created_at?: string
          eid_back_url?: string | null
          eid_front_url?: string | null
          email?: string | null
          emirate?: string | null
          id?: string
          lead_source?: string | null
          mobile_number: string
          nationality_code?: string | null
          passport_copy_url?: string | null
          remind_me?: string | null
          service_required?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          submission_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          client_converted?: boolean | null
          client_name?: string | null
          created_at?: string
          eid_back_url?: string | null
          eid_front_url?: string | null
          email?: string | null
          emirate?: string | null
          id?: string
          lead_source?: string | null
          mobile_number?: string
          nationality_code?: string | null
          passport_copy_url?: string | null
          remind_me?: string | null
          service_required?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          submission_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          permissions: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          permissions?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          permissions?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      refunds: {
        Row: {
          abscond_date: string | null
          abscond_report: boolean | null
          abu_dhabi_insurance_cancelled: boolean | null
          at_fault: boolean | null
          base_price_ex_vat: number | null
          calculation_details: Json | null
          cash_assistance_aed: number | null
          client_mobile: string | null
          client_name: string
          contract_no: string
          created_at: string
          days_worked: number | null
          delivered_date: string | null
          direct_hire: boolean | null
          doc_cancel: boolean | null
          doc_passport: boolean | null
          doc_phone: boolean | null
          due_date: string | null
          emirate: string
          enough_time: boolean | null
          fail_bring: boolean | null
          finalized_by: string | null
          gov_visa_aed: number | null
          id: string
          location: string
          medical_visa_cost_aed: number | null
          nationality: string
          notes: string | null
          option_b: boolean | null
          other_reason: string | null
          prepared_by: string | null
          price_incl_vat: number
          reason: string | null
          refund_ex_vat: number | null
          returned_date: string | null
          salary_aed: number | null
          stage: string | null
          standard_tadbeer_fees_aed: number | null
          status: string
          total_refund_amount: number
          unpaid_salary_days: number | null
          updated_at: string
          vat_amount: number | null
          vat_percent: number | null
          vat_refund: number | null
          visa_vpa_done: boolean | null
          worker_name: string
        }
        Insert: {
          abscond_date?: string | null
          abscond_report?: boolean | null
          abu_dhabi_insurance_cancelled?: boolean | null
          at_fault?: boolean | null
          base_price_ex_vat?: number | null
          calculation_details?: Json | null
          cash_assistance_aed?: number | null
          client_mobile?: string | null
          client_name: string
          contract_no: string
          created_at?: string
          days_worked?: number | null
          delivered_date?: string | null
          direct_hire?: boolean | null
          doc_cancel?: boolean | null
          doc_passport?: boolean | null
          doc_phone?: boolean | null
          due_date?: string | null
          emirate: string
          enough_time?: boolean | null
          fail_bring?: boolean | null
          finalized_by?: string | null
          gov_visa_aed?: number | null
          id?: string
          location: string
          medical_visa_cost_aed?: number | null
          nationality: string
          notes?: string | null
          option_b?: boolean | null
          other_reason?: string | null
          prepared_by?: string | null
          price_incl_vat: number
          reason?: string | null
          refund_ex_vat?: number | null
          returned_date?: string | null
          salary_aed?: number | null
          stage?: string | null
          standard_tadbeer_fees_aed?: number | null
          status?: string
          total_refund_amount: number
          unpaid_salary_days?: number | null
          updated_at?: string
          vat_amount?: number | null
          vat_percent?: number | null
          vat_refund?: number | null
          visa_vpa_done?: boolean | null
          worker_name: string
        }
        Update: {
          abscond_date?: string | null
          abscond_report?: boolean | null
          abu_dhabi_insurance_cancelled?: boolean | null
          at_fault?: boolean | null
          base_price_ex_vat?: number | null
          calculation_details?: Json | null
          cash_assistance_aed?: number | null
          client_mobile?: string | null
          client_name?: string
          contract_no?: string
          created_at?: string
          days_worked?: number | null
          delivered_date?: string | null
          direct_hire?: boolean | null
          doc_cancel?: boolean | null
          doc_passport?: boolean | null
          doc_phone?: boolean | null
          due_date?: string | null
          emirate?: string
          enough_time?: boolean | null
          fail_bring?: boolean | null
          finalized_by?: string | null
          gov_visa_aed?: number | null
          id?: string
          location?: string
          medical_visa_cost_aed?: number | null
          nationality?: string
          notes?: string | null
          option_b?: boolean | null
          other_reason?: string | null
          prepared_by?: string | null
          price_incl_vat?: number
          reason?: string | null
          refund_ex_vat?: number | null
          returned_date?: string | null
          salary_aed?: number | null
          stage?: string | null
          standard_tadbeer_fees_aed?: number | null
          status?: string
          total_refund_amount?: number
          unpaid_salary_days?: number | null
          updated_at?: string
          vat_amount?: number | null
          vat_percent?: number | null
          vat_refund?: number | null
          visa_vpa_done?: boolean | null
          worker_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_finalized_by_fkey"
            columns: ["finalized_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_prepared_by_fkey"
            columns: ["prepared_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          emirates_id_back_url: string | null
          emirates_id_front_url: string | null
          id: string
          installment_plan: boolean | null
          lead_id: string | null
          maid_passport_url: string | null
          maid_photo_url: string | null
          maid_visa_url: string | null
          medical_insurance: boolean | null
          name: string
          notes: string | null
          package: string | null
          phone: string
          status: string | null
          updated_at: string | null
          worker_photo_url: string | null
        }
        Insert: {
          addons?: string[] | null
          created_at?: string | null
          dewa_bill_url?: string | null
          email: string
          emirates_id_back_url?: string | null
          emirates_id_front_url?: string | null
          id?: string
          installment_plan?: boolean | null
          lead_id?: string | null
          maid_passport_url?: string | null
          maid_photo_url?: string | null
          maid_visa_url?: string | null
          medical_insurance?: boolean | null
          name: string
          notes?: string | null
          package?: string | null
          phone: string
          status?: string | null
          updated_at?: string | null
          worker_photo_url?: string | null
        }
        Update: {
          addons?: string[] | null
          created_at?: string | null
          dewa_bill_url?: string | null
          email?: string
          emirates_id_back_url?: string | null
          emirates_id_front_url?: string | null
          id?: string
          installment_plan?: boolean | null
          lead_id?: string | null
          maid_passport_url?: string | null
          maid_photo_url?: string | null
          maid_visa_url?: string | null
          medical_insurance?: boolean | null
          name?: string
          notes?: string | null
          package?: string | null
          phone?: string
          status?: string | null
          updated_at?: string | null
          worker_photo_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
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
      clients: {
        Row: {
          addons: string[] | null
          client_name: string | null
          created_at: string | null
          dewa_bill_url: string | null
          email: string | null
          emirate: string | null
          emirates_id_back_url: string | null
          emirates_id_front_url: string | null
          id: string | null
          installment_plan: boolean | null
          lead_id: string | null
          maid_passport_url: string | null
          maid_photo_url: string | null
          maid_visa_url: string | null
          medical_insurance: boolean | null
          mobile_number: string | null
          nationality_code: string | null
          notes: string | null
          package: string | null
          service_required: string | null
          status: string | null
          updated_at: string | null
          worker_photo_url: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_performance: {
        Row: {
          assigned_to: string | null
          conversion_rate: number | null
          hot_leads: number | null
          lost_leads: number | null
          new_leads: number | null
          sold_leads: number | null
          total_leads: number | null
          warm_leads: number | null
        }
        Relationships: []
      }
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
      lead_status: "New Lead" | "Warm" | "HOT" | "SOLD" | "LOST" | "PROBLEM"
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
      lead_status: ["New Lead", "Warm", "HOT", "SOLD", "LOST", "PROBLEM"],
    },
  },
} as const
