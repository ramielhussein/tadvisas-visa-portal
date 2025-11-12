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
      alh_pilot_requests: {
        Row: {
          community: string
          company_name: string
          contact_person: string
          created_at: string
          email: string
          id: string
          mobile: string
          monthly_handovers: string
          notes: string | null
          preferred_start: string | null
          source: string | null
          tracks: string[]
        }
        Insert: {
          community: string
          company_name: string
          contact_person: string
          created_at?: string
          email: string
          id?: string
          mobile: string
          monthly_handovers: string
          notes?: string | null
          preferred_start?: string | null
          source?: string | null
          tracks: string[]
        }
        Update: {
          community?: string
          company_name?: string
          contact_person?: string
          created_at?: string
          email?: string
          id?: string
          mobile?: string
          monthly_handovers?: string
          notes?: string | null
          preferred_start?: string | null
          source?: string | null
          tracks?: string[]
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_name: string
          account_number: string | null
          bank_name: string
          created_at: string
          currency: string | null
          current_balance: number | null
          id: string
          notes: string | null
          opening_balance: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          account_name: string
          account_number?: string | null
          bank_name: string
          created_at?: string
          currency?: string | null
          current_balance?: number | null
          id?: string
          notes?: string | null
          opening_balance?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_number?: string | null
          bank_name?: string
          created_at?: string
          currency?: string | null
          current_balance?: number | null
          id?: string
          notes?: string | null
          opening_balance?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          base_amount: number
          cancelled_at: string | null
          client_email: string | null
          client_name: string
          client_phone: string
          contract_date: string
          contract_number: string
          created_at: string
          created_by: string | null
          duration_months: number | null
          end_date: string | null
          id: string
          monthly_amount: number | null
          notes: string | null
          product_id: string
          salesman_id: string
          start_date: string
          status: string
          total_amount: number
          updated_at: string
          vat_amount: number
          vat_rate: number | null
          worker_id: string | null
        }
        Insert: {
          base_amount: number
          cancelled_at?: string | null
          client_email?: string | null
          client_name: string
          client_phone: string
          contract_date?: string
          contract_number: string
          created_at?: string
          created_by?: string | null
          duration_months?: number | null
          end_date?: string | null
          id?: string
          monthly_amount?: number | null
          notes?: string | null
          product_id: string
          salesman_id: string
          start_date: string
          status?: string
          total_amount: number
          updated_at?: string
          vat_amount: number
          vat_rate?: number | null
          worker_id?: string | null
        }
        Update: {
          base_amount?: number
          cancelled_at?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string
          contract_date?: string
          contract_number?: string
          created_at?: string
          created_by?: string | null
          duration_months?: number | null
          end_date?: string | null
          id?: string
          monthly_amount?: number | null
          notes?: string | null
          product_id?: string
          salesman_id?: string
          start_date?: string
          status?: string
          total_amount?: number
          updated_at?: string
          vat_amount?: number
          vat_rate?: number | null
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_salesman_id_fkey"
            columns: ["salesman_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_headcount: {
        Row: {
          at_accommodation: number
          at_center: number
          count_date: string
          counted_by: string
          created_at: string
          discrepancies: Json | null
          id: string
          in_transit: number
          notes: string | null
          returned_processing: number
          total_workers: number
          updated_at: string
          verified_by: string | null
          with_clients: number
        }
        Insert: {
          at_accommodation?: number
          at_center?: number
          count_date: string
          counted_by: string
          created_at?: string
          discrepancies?: Json | null
          id?: string
          in_transit?: number
          notes?: string | null
          returned_processing?: number
          total_workers?: number
          updated_at?: string
          verified_by?: string | null
          with_clients?: number
        }
        Update: {
          at_accommodation?: number
          at_center?: number
          count_date?: string
          counted_by?: string
          created_at?: string
          discrepancies?: Json | null
          id?: string
          in_transit?: number
          notes?: string | null
          returned_processing?: number
          total_workers?: number
          updated_at?: string
          verified_by?: string | null
          with_clients?: number
        }
        Relationships: []
      }
      deals: {
        Row: {
          assigned_to: string | null
          attachments: Json | null
          client_email: string | null
          client_name: string
          client_phone: string
          closed_at: string | null
          commission_amount: number | null
          commission_rate: number | null
          created_at: string
          deal_number: string
          deal_value: number
          id: string
          lead_id: string | null
          notes: string | null
          payment_terms: string | null
          service_description: string | null
          service_type: string
          status: string
          total_amount: number
          updated_at: string
          vat_amount: number | null
          vat_rate: number | null
          worker_id: string | null
          worker_name: string | null
        }
        Insert: {
          assigned_to?: string | null
          attachments?: Json | null
          client_email?: string | null
          client_name: string
          client_phone: string
          closed_at?: string | null
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string
          deal_number: string
          deal_value: number
          id?: string
          lead_id?: string | null
          notes?: string | null
          payment_terms?: string | null
          service_description?: string | null
          service_type: string
          status?: string
          total_amount: number
          updated_at?: string
          vat_amount?: number | null
          vat_rate?: number | null
          worker_id?: string | null
          worker_name?: string | null
        }
        Update: {
          assigned_to?: string | null
          attachments?: Json | null
          client_email?: string | null
          client_name?: string
          client_phone?: string
          closed_at?: string | null
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string
          deal_number?: string
          deal_value?: number
          id?: string
          lead_id?: string | null
          notes?: string | null
          payment_terms?: string | null
          service_description?: string | null
          service_type?: string
          status?: string
          total_amount?: number
          updated_at?: string
          vat_amount?: number | null
          vat_rate?: number | null
          worker_id?: string | null
          worker_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_orders: {
        Row: {
          client_name: string
          client_phone: string
          client_signature: string | null
          contract_id: string | null
          created_at: string
          delivered_by: string
          delivery_date: string
          delivery_location: string
          delivery_number: string
          id: string
          items_delivered: Json | null
          notes: string | null
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
          worker_id: string
        }
        Insert: {
          client_name: string
          client_phone: string
          client_signature?: string | null
          contract_id?: string | null
          created_at?: string
          delivered_by: string
          delivery_date?: string
          delivery_location: string
          delivery_number: string
          id?: string
          items_delivered?: Json | null
          notes?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          worker_id: string
        }
        Update: {
          client_name?: string
          client_phone?: string
          client_signature?: string | null
          contract_id?: string | null
          created_at?: string
          delivered_by?: string
          delivery_date?: string
          delivery_location?: string
          delivery_number?: string
          id?: string
          items_delivered?: Json | null
          notes?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_orders_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_orders_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      equity_accounts: {
        Row: {
          account_name: string
          account_type: string
          created_at: string
          currency: string | null
          current_balance: number | null
          id: string
          is_active: boolean | null
          notes: string | null
          opening_balance: number | null
          owner_name: string | null
          updated_at: string
        }
        Insert: {
          account_name: string
          account_type?: string
          created_at?: string
          currency?: string | null
          current_balance?: number | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          opening_balance?: number | null
          owner_name?: string | null
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_type?: string
          created_at?: string
          currency?: string | null
          current_balance?: number | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          opening_balance?: number | null
          owner_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inquiry_packages: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          package_name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          package_name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          package_name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          balance_due: number
          client_email: string | null
          client_name: string
          client_phone: string
          created_at: string
          deal_id: string | null
          due_date: string
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          paid_amount: number | null
          paid_at: string | null
          payment_method: string | null
          status: string
          subtotal: number
          total_amount: number
          updated_at: string
          vat_amount: number
          vat_rate: number | null
        }
        Insert: {
          balance_due: number
          client_email?: string | null
          client_name: string
          client_phone: string
          created_at?: string
          deal_id?: string | null
          due_date: string
          id?: string
          invoice_date?: string
          invoice_number: string
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          subtotal: number
          total_amount: number
          updated_at?: string
          vat_amount: number
          vat_rate?: number | null
        }
        Update: {
          balance_due?: number
          client_email?: string | null
          client_name?: string
          client_phone?: string
          created_at?: string
          deal_id?: string | null
          due_date?: string
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          subtotal?: number
          total_amount?: number
          updated_at?: string
          vat_amount?: number
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          activity_subtype: string | null
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
          activity_subtype?: string | null
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
          activity_subtype?: string | null
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
      lead_sources: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          sort_order: number | null
          source_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          source_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          source_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          archived: boolean
          assigned_to: string | null
          client_converted: boolean | null
          client_name: string | null
          comments: string | null
          created_at: string
          eid_back_url: string | null
          eid_front_url: string | null
          email: string | null
          emirate: string | null
          hot: boolean | null
          id: string
          lead_source: string | null
          lost_at: string | null
          lost_by: string | null
          lost_reason: string | null
          mobile_number: string
          nationality_code: string | null
          passport_copy_url: string | null
          previously_lost: boolean | null
          remind_me: string | null
          service_required: string | null
          status: Database["public"]["Enums"]["lead_status"]
          submission_id: string | null
          updated_at: string
          visa_expiry_date: string | null
        }
        Insert: {
          archived?: boolean
          assigned_to?: string | null
          client_converted?: boolean | null
          client_name?: string | null
          comments?: string | null
          created_at?: string
          eid_back_url?: string | null
          eid_front_url?: string | null
          email?: string | null
          emirate?: string | null
          hot?: boolean | null
          id?: string
          lead_source?: string | null
          lost_at?: string | null
          lost_by?: string | null
          lost_reason?: string | null
          mobile_number: string
          nationality_code?: string | null
          passport_copy_url?: string | null
          previously_lost?: boolean | null
          remind_me?: string | null
          service_required?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          submission_id?: string | null
          updated_at?: string
          visa_expiry_date?: string | null
        }
        Update: {
          archived?: boolean
          assigned_to?: string | null
          client_converted?: boolean | null
          client_name?: string | null
          comments?: string | null
          created_at?: string
          eid_back_url?: string | null
          eid_front_url?: string | null
          email?: string | null
          emirate?: string | null
          hot?: boolean | null
          id?: string
          lead_source?: string | null
          lost_at?: string | null
          lost_by?: string | null
          lost_reason?: string | null
          mobile_number?: string
          nationality_code?: string | null
          passport_copy_url?: string | null
          previously_lost?: boolean | null
          remind_me?: string | null
          service_required?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          submission_id?: string | null
          updated_at?: string
          visa_expiry_date?: string | null
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
      nationality_workflows: {
        Row: {
          agent_informed_date: string | null
          arrival_date: string | null
          created_at: string
          created_by: string
          current_step: string
          documents: Json | null
          id: string
          medical_obtained_date: string | null
          nationality_code: string
          notes: string | null
          po_raised_date: string | null
          ticket_booked_date: string | null
          travel_date: string | null
          updated_at: string
          visa_applied_date: string | null
          visa_received_date: string | null
          visa_type: string | null
          worker_id: string
          workflow_status: string
        }
        Insert: {
          agent_informed_date?: string | null
          arrival_date?: string | null
          created_at?: string
          created_by: string
          current_step: string
          documents?: Json | null
          id?: string
          medical_obtained_date?: string | null
          nationality_code: string
          notes?: string | null
          po_raised_date?: string | null
          ticket_booked_date?: string | null
          travel_date?: string | null
          updated_at?: string
          visa_applied_date?: string | null
          visa_received_date?: string | null
          visa_type?: string | null
          worker_id: string
          workflow_status?: string
        }
        Update: {
          agent_informed_date?: string | null
          arrival_date?: string | null
          created_at?: string
          created_by?: string
          current_step?: string
          documents?: Json | null
          id?: string
          medical_obtained_date?: string | null
          nationality_code?: string
          notes?: string | null
          po_raised_date?: string | null
          ticket_booked_date?: string | null
          travel_date?: string | null
          updated_at?: string
          visa_applied_date?: string | null
          visa_received_date?: string | null
          visa_type?: string | null
          worker_id?: string
          workflow_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "nationality_workflows_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_lead_id: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_lead_id?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_lead_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_lead_id_fkey"
            columns: ["related_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          commission_rate: number | null
          created_at: string
          id: string
          is_active: boolean | null
          method_name: string
          notes: string | null
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          method_name: string
          notes?: string | null
        }
        Update: {
          commission_rate?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          method_name?: string
          notes?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          bank_account_id: string | null
          client_name: string
          client_phone: string
          created_at: string
          id: string
          invoice_id: string | null
          notes: string | null
          payment_date: string
          payment_method: string | null
          payment_number: string
          recorded_by: string | null
          reference_number: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          client_name: string
          client_phone: string
          created_at?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          payment_number: string
          recorded_by?: string | null
          reference_number?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          client_name?: string
          client_phone?: string
          created_at?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          payment_number?: string
          recorded_by?: string | null
          reference_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allows_manual_adjustment: boolean | null
          code: string
          created_at: string
          default_amount: number | null
          default_duration_months: number | null
          description: string | null
          id: string
          is_active: boolean | null
          is_monthly: boolean | null
          name: string
          product_type: string
          updated_at: string
        }
        Insert: {
          allows_manual_adjustment?: boolean | null
          code: string
          created_at?: string
          default_amount?: number | null
          default_duration_months?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_monthly?: boolean | null
          name: string
          product_type: string
          updated_at?: string
        }
        Update: {
          allows_manual_adjustment?: boolean | null
          code?: string
          created_at?: string
          default_amount?: number | null
          default_duration_months?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_monthly?: boolean | null
          name?: string
          product_type?: string
          updated_at?: string
        }
        Relationships: []
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
      purchase_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string
          currency: string
          id: string
          notes: string | null
          paid_at: string | null
          payment_terms: string | null
          po_date: string
          po_number: string
          status: Database["public"]["Enums"]["po_status"]
          supplier_id: string | null
          total_amount: number
          updated_at: string
          worker_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by: string
          currency?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_terms?: string | null
          po_date?: string
          po_number: string
          status?: Database["public"]["Enums"]["po_status"]
          supplier_id?: string | null
          total_amount?: number
          updated_at?: string
          worker_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_terms?: string | null
          po_date?: string
          po_number?: string
          status?: Database["public"]["Enums"]["po_status"]
          supplier_id?: string | null
          total_amount?: number
          updated_at?: string
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_balances"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      receipt_orders: {
        Row: {
          condition_notes: string | null
          created_at: string
          documents_received: Json | null
          id: string
          location: string
          po_id: string | null
          receipt_date: string
          receipt_number: string
          received_by: string
          received_from: string
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
          worker_id: string
        }
        Insert: {
          condition_notes?: string | null
          created_at?: string
          documents_received?: Json | null
          id?: string
          location: string
          po_id?: string | null
          receipt_date?: string
          receipt_number: string
          received_by: string
          received_from: string
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          worker_id: string
        }
        Update: {
          condition_notes?: string | null
          created_at?: string
          documents_received?: Json | null
          id?: string
          location?: string
          po_id?: string | null
          receipt_date?: string
          receipt_number?: string
          received_by?: string
          received_from?: string
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipt_orders_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_orders_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          abscond_date: string | null
          abscond_report: boolean | null
          abu_dhabi_insurance_cancelled: boolean | null
          approved_at: string | null
          approved_by: string | null
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
          rejection_reason: string | null
          returned_date: string | null
          salary_aed: number | null
          stage: string | null
          standard_tadbeer_fees_aed: number | null
          status: string
          supplier_invoice_id: string | null
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
          approved_at?: string | null
          approved_by?: string | null
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
          rejection_reason?: string | null
          returned_date?: string | null
          salary_aed?: number | null
          stage?: string | null
          standard_tadbeer_fees_aed?: number | null
          status?: string
          supplier_invoice_id?: string | null
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
          approved_at?: string | null
          approved_by?: string | null
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
          rejection_reason?: string | null
          returned_date?: string | null
          salary_aed?: number | null
          stage?: string | null
          standard_tadbeer_fees_aed?: number | null
          status?: string
          supplier_invoice_id?: string | null
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
          {
            foreignKeyName: "refunds_supplier_invoice_id_fkey"
            columns: ["supplier_invoice_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_targets: {
        Row: {
          activity_target: number
          conversion_rate_target: number
          created_at: string
          created_by: string
          deals_target: number
          id: string
          notes: string | null
          period_end: string
          period_start: string
          period_type: string
          revenue_target: number
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_target?: number
          conversion_rate_target?: number
          created_at?: string
          created_by: string
          deals_target?: number
          id?: string
          notes?: string | null
          period_end: string
          period_start: string
          period_type?: string
          revenue_target?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_target?: number
          conversion_rate_target?: number
          created_at?: string
          created_by?: string
          deals_target?: number
          id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          period_type?: string
          revenue_target?: number
          updated_at?: string
          user_id?: string
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
      suggested_supplier_types: {
        Row: {
          created_at: string | null
          id: string
          sort_order: number | null
          type_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          sort_order?: number | null
          type_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          sort_order?: number | null
          type_name?: string
        }
        Relationships: []
      }
      supplier_invoices: {
        Row: {
          balance_due: number
          created_at: string
          description: string | null
          due_date: string
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          paid_amount: number | null
          paid_at: string | null
          payment_method: string | null
          status: string
          subtotal: number
          supplier_id: string | null
          supplier_name: string
          total_amount: number
          updated_at: string
          vat_amount: number
          vat_rate: number | null
        }
        Insert: {
          balance_due: number
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          invoice_date?: string
          invoice_number: string
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          subtotal: number
          supplier_id?: string | null
          supplier_name: string
          total_amount: number
          updated_at?: string
          vat_amount: number
          vat_rate?: number | null
        }
        Update: {
          balance_due?: number
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          subtotal?: number
          supplier_id?: string | null
          supplier_name?: string
          total_amount?: number
          updated_at?: string
          vat_amount?: number
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_balances"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "supplier_invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          account_balance: number | null
          address: string | null
          contact_person: string
          created_at: string
          currency: string | null
          email: string | null
          id: string
          notes: string | null
          payment_terms: string | null
          phone: string
          status: string | null
          supplier_name: string
          supplier_type: string
          tax_registration: string | null
          telephone: string
          updated_at: string
        }
        Insert: {
          account_balance?: number | null
          address?: string | null
          contact_person: string
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          notes?: string | null
          payment_terms?: string | null
          phone: string
          status?: string | null
          supplier_name: string
          supplier_type: string
          tax_registration?: string | null
          telephone?: string
          updated_at?: string
        }
        Update: {
          account_balance?: number | null
          address?: string | null
          contact_person?: string
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string
          status?: string | null
          supplier_name?: string
          supplier_type?: string
          tax_registration?: string | null
          telephone?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_type: string
          amount: number
          bank_account_id: string | null
          created_at: string
          created_by: string | null
          credit_account: string | null
          deal_id: string | null
          debit_account: string | null
          equity_account_id: string | null
          id: string
          invoice_id: string | null
          net_amount: number | null
          notes: string | null
          payment_commission_amount: number | null
          payment_commission_rate: number | null
          payment_method: string | null
          reference_number: string | null
          status: string
          supplier_id: string | null
          supplier_invoice_id: string | null
          transaction_date: string
          transaction_number: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          account_type: string
          amount: number
          bank_account_id?: string | null
          created_at?: string
          created_by?: string | null
          credit_account?: string | null
          deal_id?: string | null
          debit_account?: string | null
          equity_account_id?: string | null
          id?: string
          invoice_id?: string | null
          net_amount?: number | null
          notes?: string | null
          payment_commission_amount?: number | null
          payment_commission_rate?: number | null
          payment_method?: string | null
          reference_number?: string | null
          status?: string
          supplier_id?: string | null
          supplier_invoice_id?: string | null
          transaction_date?: string
          transaction_number: string
          transaction_type: string
          updated_at?: string
        }
        Update: {
          account_type?: string
          amount?: number
          bank_account_id?: string | null
          created_at?: string
          created_by?: string | null
          credit_account?: string | null
          deal_id?: string | null
          debit_account?: string | null
          equity_account_id?: string | null
          id?: string
          invoice_id?: string | null
          net_amount?: number | null
          notes?: string | null
          payment_commission_amount?: number | null
          payment_commission_rate?: number | null
          payment_method?: string | null
          reference_number?: string | null
          status?: string
          supplier_id?: string | null
          supplier_invoice_id?: string | null
          transaction_date?: string
          transaction_number?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_equity_account_id_fkey"
            columns: ["equity_account_id"]
            isOneToOne: false
            referencedRelation: "equity_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_balances"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "transactions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_supplier_invoice_id_fkey"
            columns: ["supplier_invoice_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoices"
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
      worker_returns: {
        Row: {
          belongings_returned: boolean
          cleared_at: string | null
          cleared_by: string | null
          contract_id: string | null
          created_at: string
          evaluation_completed: boolean
          evaluation_notes: string | null
          id: string
          notes: string | null
          phone_returned: boolean
          ready_to_redeploy: boolean
          reason: string
          return_date: string
          returned_from: string
          updated_at: string
          visa_cancellation_date: string | null
          visa_cancelled: boolean
          worker_id: string
        }
        Insert: {
          belongings_returned?: boolean
          cleared_at?: string | null
          cleared_by?: string | null
          contract_id?: string | null
          created_at?: string
          evaluation_completed?: boolean
          evaluation_notes?: string | null
          id?: string
          notes?: string | null
          phone_returned?: boolean
          ready_to_redeploy?: boolean
          reason: string
          return_date?: string
          returned_from: string
          updated_at?: string
          visa_cancellation_date?: string | null
          visa_cancelled?: boolean
          worker_id: string
        }
        Update: {
          belongings_returned?: boolean
          cleared_at?: string | null
          cleared_by?: string | null
          contract_id?: string | null
          created_at?: string
          evaluation_completed?: boolean
          evaluation_notes?: string | null
          id?: string
          notes?: string | null
          phone_returned?: boolean
          ready_to_redeploy?: boolean
          reason?: string
          return_date?: string
          returned_from?: string
          updated_at?: string
          visa_cancellation_date?: string | null
          visa_cancelled?: boolean
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_returns_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_returns_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_suppliers: {
        Row: {
          cost_amount: number
          cost_currency: string | null
          cost_type: string
          created_at: string
          id: string
          notes: string | null
          supplier_id: string
          updated_at: string
          worker_id: string
        }
        Insert: {
          cost_amount?: number
          cost_currency?: string | null
          cost_type: string
          created_at?: string
          id?: string
          notes?: string | null
          supplier_id: string
          updated_at?: string
          worker_id: string
        }
        Update: {
          cost_amount?: number
          cost_currency?: string | null
          cost_type?: string
          created_at?: string
          id?: string
          notes?: string | null
          supplier_id?: string
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_balances"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "worker_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_suppliers_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_transfers: {
        Row: {
          client_name: string | null
          contract_id: string | null
          created_at: string
          documents: Json | null
          driver_name: string | null
          driver_phone: string | null
          from_location: string
          handled_by: string
          id: string
          notes: string | null
          to_location: string
          transfer_date: string
          transfer_number: string
          transfer_type: Database["public"]["Enums"]["transfer_type"]
          updated_at: string
          vehicle_number: string | null
          worker_id: string
        }
        Insert: {
          client_name?: string | null
          contract_id?: string | null
          created_at?: string
          documents?: Json | null
          driver_name?: string | null
          driver_phone?: string | null
          from_location: string
          handled_by: string
          id?: string
          notes?: string | null
          to_location: string
          transfer_date?: string
          transfer_number: string
          transfer_type: Database["public"]["Enums"]["transfer_type"]
          updated_at?: string
          vehicle_number?: string | null
          worker_id: string
        }
        Update: {
          client_name?: string | null
          contract_id?: string | null
          created_at?: string
          documents?: Json | null
          driver_name?: string | null
          driver_phone?: string | null
          from_location?: string
          handled_by?: string
          id?: string
          notes?: string | null
          to_location?: string
          transfer_date?: string
          transfer_number?: string
          transfer_type?: Database["public"]["Enums"]["transfer_type"]
          updated_at?: string
          vehicle_number?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_transfers_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_transfers_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      workers: {
        Row: {
          center_ref: string | null
          children: number | null
          created_at: string | null
          created_by: string | null
          date_of_birth: string | null
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
          center_ref?: string | null
          children?: number | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
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
          center_ref?: string | null
          children?: number | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
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
      account_balances: {
        Row: {
          client_name: string | null
          client_phone: string | null
          latest_due_date: string | null
          overdue_invoices: number | null
          pending_invoices: number | null
          total_invoiced: number | null
          total_outstanding: number | null
          total_paid: number | null
        }
        Relationships: []
      }
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
      supplier_balances: {
        Row: {
          latest_due_date: string | null
          overdue_invoices: number | null
          pending_invoices: number | null
          phone: string | null
          supplier_id: string | null
          supplier_name: string | null
          supplier_type: string | null
          total_invoiced: number | null
          total_outstanding: number | null
          total_paid: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_net_amount: {
        Args: { commission_rate: number; gross_amount: number }
        Returns: number
      }
      generate_contract_number: { Args: never; Returns: string }
      generate_deal_number: { Args: never; Returns: string }
      generate_delivery_number: { Args: never; Returns: string }
      generate_invoice_number: { Args: never; Returns: string }
      generate_payment_number: { Args: never; Returns: string }
      generate_po_number: { Args: never; Returns: string }
      generate_receipt_number: { Args: never; Returns: string }
      generate_supplier_invoice_number: { Args: never; Returns: string }
      generate_transaction_number: { Args: never; Returns: string }
      generate_transfer_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      log_audit: {
        Args: {
          p_action: string
          p_new_data?: Json
          p_old_data?: Json
          p_record_id?: string
          p_table_name?: string
          p_user_email: string
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "user"
        | "sales"
        | "finance"
        | "product"
        | "client"
        | "super_admin"
      lead_status:
        | "New Lead"
        | "Warm"
        | "HOT"
        | "SOLD"
        | "LOST"
        | "PROBLEM"
        | "Called No Answer"
        | "Called Engaged"
        | "Called COLD"
        | "Called Unanswer 2"
        | "No Connection"
      order_status: "Pending" | "Completed" | "Cancelled"
      po_status:
        | "Draft"
        | "Pending Approval"
        | "Approved"
        | "Paid"
        | "Cancelled"
      transfer_type:
        | "Airport to Accommodation"
        | "Accommodation to Office"
        | "Office to Center"
        | "Center to Client"
        | "Client to Accommodation"
        | "Client to Office"
        | "Between Accommodations"
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
      app_role: [
        "admin",
        "user",
        "sales",
        "finance",
        "product",
        "client",
        "super_admin",
      ],
      lead_status: [
        "New Lead",
        "Warm",
        "HOT",
        "SOLD",
        "LOST",
        "PROBLEM",
        "Called No Answer",
        "Called Engaged",
        "Called COLD",
        "Called Unanswer 2",
        "No Connection",
      ],
      order_status: ["Pending", "Completed", "Cancelled"],
      po_status: ["Draft", "Pending Approval", "Approved", "Paid", "Cancelled"],
      transfer_type: [
        "Airport to Accommodation",
        "Accommodation to Office",
        "Office to Center",
        "Center to Client",
        "Client to Accommodation",
        "Client to Office",
        "Between Accommodations",
      ],
    },
  },
} as const
