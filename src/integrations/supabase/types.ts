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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_broadcasts: {
        Row: {
          audience: string
          body: string
          created_at: string
          id: string
          recipient_count: number
          sent_by: string | null
          title: string
        }
        Insert: {
          audience?: string
          body: string
          created_at?: string
          id?: string
          recipient_count?: number
          sent_by?: string | null
          title: string
        }
        Update: {
          audience?: string
          body?: string
          created_at?: string
          id?: string
          recipient_count?: number
          sent_by?: string | null
          title?: string
        }
        Relationships: []
      }
      auto_approval_rules: {
        Row: {
          category_id: string | null
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          max_amount_all: number
          name: string
        }
        Insert: {
          category_id?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_amount_all: number
          name: string
        }
        Update: {
          category_id?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_amount_all?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_approval_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_approval_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          key: string
          name: string
          requirement: string | null
          tier: string
        }
        Insert: {
          created_at?: string
          description: string
          icon: string
          id?: string
          key: string
          name: string
          requirement?: string | null
          tier?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          key?: string
          name?: string
          requirement?: string | null
          tier?: string
        }
        Relationships: []
      }
      benefit_requests: {
        Row: {
          auto_approved: boolean
          company_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          note: string | null
          package_id: string | null
          reject_reason: string | null
          status: Database["public"]["Enums"]["benefit_request_status"]
          total_all: number
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_approved?: boolean
          company_id: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          note?: string | null
          package_id?: string | null
          reject_reason?: string | null
          status?: Database["public"]["Enums"]["benefit_request_status"]
          total_all: number
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_approved?: boolean
          company_id?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          note?: string | null
          package_id?: string | null
          reject_reason?: string | null
          status?: Database["public"]["Enums"]["benefit_request_status"]
          total_all?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "benefit_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benefit_requests_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      box_openings: {
        Row: {
          box_id: string
          created_at: string
          id: string
          points_awarded: number
          rarity: string | null
          reward_id: string | null
          reward_label: string
          user_id: string
        }
        Insert: {
          box_id: string
          created_at?: string
          id?: string
          points_awarded?: number
          rarity?: string | null
          reward_id?: string | null
          reward_label: string
          user_id: string
        }
        Update: {
          box_id?: string
          created_at?: string
          id?: string
          points_awarded?: number
          rarity?: string | null
          reward_id?: string | null
          reward_label?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "box_openings_box_id_fkey"
            columns: ["box_id"]
            isOneToOne: false
            referencedRelation: "mystery_boxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "box_openings_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "box_rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      box_rewards: {
        Row: {
          box_id: string
          created_at: string
          description: string | null
          icon: string
          id: string
          label: string
          points_value: number
          rarity: string
          weight: number
        }
        Insert: {
          box_id: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          label: string
          points_value?: number
          rarity?: string
          weight?: number
        }
        Update: {
          box_id?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          label?: string
          points_value?: number
          rarity?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "box_rewards_box_id_fkey"
            columns: ["box_id"]
            isOneToOne: false
            referencedRelation: "mystery_boxes"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description_en: string | null
          description_sq: string | null
          icon: string | null
          id: string
          is_active: boolean
          name_en: string
          name_sq: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_en?: string | null
          description_sq?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name_en: string
          name_sq: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_en?: string | null
          description_sq?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name_en?: string
          name_sq?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      circle_members: {
        Row: {
          circle_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          circle_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          circle_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_members_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_messages: {
        Row: {
          body: string
          circle_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          body: string
          circle_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          body?: string
          circle_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_messages_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      circles: {
        Row: {
          category_id: string | null
          cover_color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_public: boolean
          member_count: number
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          cover_color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_public?: boolean
          member_count?: number
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          cover_color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_public?: boolean
          member_count?: number
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "circles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          city: string | null
          created_at: string
          currency: string
          id: string
          industry: string | null
          logo_url: string | null
          monthly_default_budget_all: number
          name: string
          owner_id: string
          size_label: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          currency?: string
          id?: string
          industry?: string | null
          logo_url?: string | null
          monthly_default_budget_all?: number
          name: string
          owner_id: string
          size_label?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          currency?: string
          id?: string
          industry?: string | null
          logo_url?: string | null
          monthly_default_budget_all?: number
          name?: string
          owner_id?: string
          size_label?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_employees: {
        Row: {
          company_id: string
          created_at: string
          department: string | null
          full_name: string | null
          id: string
          invite_email: string | null
          monthly_budget_all: number | null
          status: Database["public"]["Enums"]["employee_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          department?: string | null
          full_name?: string | null
          id?: string
          invite_email?: string | null
          monthly_budget_all?: number | null
          status?: Database["public"]["Enums"]["employee_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          department?: string | null
          full_name?: string | null
          id?: string
          invite_email?: string | null
          monthly_budget_all?: number | null
          status?: Database["public"]["Enums"]["employee_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_budgets: {
        Row: {
          company_id: string
          created_at: string
          id: string
          period_end: string
          period_start: string
          total_all: number
          updated_at: string
          used_all: number
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          total_all?: number
          updated_at?: string
          used_all?: number
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          total_all?: number
          updated_at?: string
          used_all?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_budgets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          offer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          offer_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          offer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      fx_rates: {
        Row: {
          base: string
          fetched_at: string
          quote: string
          rate: number
        }
        Insert: {
          base: string
          fetched_at?: string
          quote: string
          rate: number
        }
        Update: {
          base?: string
          fetched_at?: string
          quote?: string
          rate?: number
        }
        Relationships: []
      }
      gifts: {
        Row: {
          amount_all: number
          created_at: string
          from_user: string
          id: string
          message: string | null
          status: string
          to_user: string
        }
        Insert: {
          amount_all: number
          created_at?: string
          from_user: string
          id?: string
          message?: string | null
          status?: string
          to_user: string
        }
        Update: {
          amount_all?: number
          created_at?: string
          from_user?: string
          id?: string
          message?: string | null
          status?: string
          to_user?: string
        }
        Relationships: []
      }
      mystery_boxes: {
        Row: {
          cost_points: number
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          key: string
          name: string
          tier: string
        }
        Insert: {
          cost_points: number
          created_at?: string
          description: string
          icon?: string
          id?: string
          is_active?: boolean
          key: string
          name: string
          tier?: string
        }
        Update: {
          cost_points?: number
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          key?: string
          name?: string
          tier?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          href: string | null
          id: string
          is_read: boolean
          kind: string
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          is_read?: boolean
          kind: string
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          is_read?: boolean
          kind?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      offer_images: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          offer_id: string
          sort_order: number
          url: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          offer_id: string
          sort_order?: number
          url: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          offer_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_images_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          available_from: string | null
          available_to: string | null
          capacity: number | null
          category_id: string | null
          city: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          discount_percent: number | null
          favorites_count: number
          id: string
          is_featured: boolean
          is_limited_time: boolean
          is_trending: boolean
          original_price_all: number | null
          price_all: number
          price_eur: number
          provider_id: string
          published_at: string | null
          rating_avg: number
          rating_count: number
          rejected_reason: string | null
          remaining: number | null
          slug: string
          status: Database["public"]["Enums"]["offer_status"]
          subtitle: string | null
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          available_from?: string | null
          available_to?: string | null
          capacity?: number | null
          category_id?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          favorites_count?: number
          id?: string
          is_featured?: boolean
          is_limited_time?: boolean
          is_trending?: boolean
          original_price_all?: number | null
          price_all?: number
          price_eur?: number
          provider_id: string
          published_at?: string | null
          rating_avg?: number
          rating_count?: number
          rejected_reason?: string | null
          remaining?: number | null
          slug: string
          status?: Database["public"]["Enums"]["offer_status"]
          subtitle?: string | null
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          available_from?: string | null
          available_to?: string | null
          capacity?: number | null
          category_id?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          favorites_count?: number
          id?: string
          is_featured?: boolean
          is_limited_time?: boolean
          is_trending?: boolean
          original_price_all?: number | null
          price_all?: number
          price_eur?: number
          provider_id?: string
          published_at?: string | null
          rating_avg?: number
          rating_count?: number
          rejected_reason?: string | null
          remaining?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["offer_status"]
          subtitle?: string | null
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "offers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      package_items: {
        Row: {
          created_at: string
          id: string
          offer_id: string
          package_id: string
          provider_id: string
          quantity: number
          unit_price_all: number
        }
        Insert: {
          created_at?: string
          id?: string
          offer_id: string
          package_id: string
          provider_id: string
          quantity?: number
          unit_price_all: number
        }
        Update: {
          created_at?: string
          id?: string
          offer_id?: string
          package_id?: string
          provider_id?: string
          quantity?: number
          unit_price_all?: number
        }
        Relationships: [
          {
            foreignKeyName: "package_items_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_items_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_items_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          name: string
          status: Database["public"]["Enums"]["package_status"]
          total_all: number
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["package_status"]
          total_all?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["package_status"]
          total_all?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "packages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      perk_checkins: {
        Row: {
          created_at: string
          id: string
          lat: number
          lng: number
          provider_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lat: number
          lng: number
          provider_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          provider_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "perk_checkins_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      points_ledger: {
        Row: {
          created_at: string
          delta: number
          id: string
          metadata: Json | null
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          id?: string
          metadata?: Json | null
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: string
          metadata?: Json | null
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          currency: string
          email: string | null
          first_name: string | null
          id: string
          language: string
          last_name: string | null
          phone: string | null
          suspended: boolean
          suspended_reason: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          first_name?: string | null
          id: string
          language?: string
          last_name?: string | null
          phone?: string | null
          suspended?: boolean
          suspended_reason?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          first_name?: string | null
          id?: string
          language?: string
          last_name?: string | null
          phone?: string | null
          suspended?: boolean
          suspended_reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      providers: {
        Row: {
          address: string | null
          city: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          lat: number | null
          lng: number | null
          logo_url: string | null
          name: string
          owner_id: string | null
          phone: string | null
          rating_avg: number
          rating_count: number
          slug: string
          status: Database["public"]["Enums"]["provider_status"]
          tagline: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name: string
          owner_id?: string | null
          phone?: string | null
          rating_avg?: number
          rating_count?: number
          slug: string
          status?: Database["public"]["Enums"]["provider_status"]
          tagline?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          phone?: string | null
          rating_avg?: number
          rating_count?: number
          slug?: string
          status?: Database["public"]["Enums"]["provider_status"]
          tagline?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      quest_progress: {
        Row: {
          claimed_at: string | null
          completed_at: string | null
          created_at: string
          id: string
          period_key: string
          progress: number
          quest_id: string
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          period_key: string
          progress?: number
          quest_id: string
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          period_key?: string
          progress?: number
          quest_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quest_progress_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      quests: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          key: string
          kind: string
          reward_points: number
          target: number
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          icon?: string
          id?: string
          is_active?: boolean
          key: string
          kind?: string
          reward_points?: number
          target?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          key?: string
          kind?: string
          reward_points?: number
          target?: number
          title?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          offer_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          offer_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          offer_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      seasonal_drops: {
        Row: {
          cover_image: string | null
          created_at: string
          ends_at: string
          featured_offer_ids: string[]
          id: string
          is_active: boolean
          slug: string
          starts_at: string
          subtitle: string | null
          theme_color: string | null
          title: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          ends_at?: string
          featured_offer_ids?: string[]
          id?: string
          is_active?: boolean
          slug: string
          starts_at?: string
          subtitle?: string | null
          theme_color?: string | null
          title: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          ends_at?: string
          featured_offer_ids?: string[]
          id?: string
          is_active?: boolean
          slug?: string
          starts_at?: string
          subtitle?: string | null
          theme_color?: string | null
          title?: string
        }
        Relationships: []
      }
      team_deal_joiners: {
        Row: {
          id: string
          joined_at: string
          team_deal_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          team_deal_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          team_deal_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_deal_joiners_team_deal_id_fkey"
            columns: ["team_deal_id"]
            isOneToOne: false
            referencedRelation: "team_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      team_deals: {
        Row: {
          created_at: string
          discount_percent: number
          ends_at: string
          id: string
          joined_count: number
          offer_id: string
          threshold: number
          title: string
        }
        Insert: {
          created_at?: string
          discount_percent?: number
          ends_at?: string
          id?: string
          joined_count?: number
          offer_id: string
          threshold?: number
          title: string
        }
        Update: {
          created_at?: string
          discount_percent?: number
          ends_at?: string
          id?: string
          joined_count?: number
          offer_id?: string
          threshold?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_deals_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount_all: number
          company_id: string
          created_at: string
          id: string
          offer_id: string | null
          package_id: string | null
          provider_id: string
          redeemed_at: string | null
          redeemed_by: string | null
          reference: string | null
          request_id: string
          status: Database["public"]["Enums"]["transaction_status"]
          user_id: string
        }
        Insert: {
          amount_all: number
          company_id: string
          created_at?: string
          id?: string
          offer_id?: string | null
          package_id?: string | null
          provider_id: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          reference?: string | null
          request_id: string
          status?: Database["public"]["Enums"]["transaction_status"]
          user_id: string
        }
        Update: {
          amount_all?: number
          company_id?: string
          created_at?: string
          id?: string
          offer_id?: string | null
          package_id?: string | null
          provider_id?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          reference?: string | null
          request_id?: string
          status?: Database["public"]["Enums"]["transaction_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "benefit_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          available_points: number
          created_at: string
          current_streak: number
          last_activity_date: string | null
          level: number
          longest_streak: number
          total_points: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          available_points?: number
          created_at?: string
          current_streak?: number
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          total_points?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          available_points?: number
          created_at?: string
          current_streak?: number
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          total_points?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_benefit_request: {
        Args: { _request_id: string }
        Returns: {
          auto_approved: boolean
          company_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          note: string | null
          package_id: string | null
          reject_reason: string | null
          status: Database["public"]["Enums"]["benefit_request_status"]
          total_all: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "benefit_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      award_points: {
        Args: {
          _delta: number
          _metadata?: Json
          _reason: string
          _user_id: string
        }
        Returns: {
          available_points: number
          created_at: string
          current_streak: number
          last_activity_date: string | null
          level: number
          longest_streak: number
          total_points: number
          updated_at: string
          user_id: string
          xp: number
        }
        SetofOptions: {
          from: "*"
          to: "user_stats"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_company_owner: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      level_for_xp: { Args: { _xp: number }; Returns: number }
      open_mystery_box: {
        Args: { _box_id: string }
        Returns: {
          box_id: string
          created_at: string
          id: string
          points_awarded: number
          rarity: string | null
          reward_id: string | null
          reward_label: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "box_openings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      redeem_transaction: {
        Args: { _reference: string }
        Returns: {
          amount_all: number
          company_id: string
          created_at: string
          id: string
          offer_id: string | null
          package_id: string | null
          provider_id: string
          redeemed_at: string | null
          redeemed_by: string | null
          reference: string | null
          request_id: string
          status: Database["public"]["Enums"]["transaction_status"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reject_benefit_request: {
        Args: { _reason: string; _request_id: string }
        Returns: {
          auto_approved: boolean
          company_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          note: string | null
          package_id: string | null
          reject_reason: string | null
          status: Database["public"]["Enums"]["benefit_request_status"]
          total_all: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "benefit_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      send_broadcast: {
        Args: { p_audience: string; p_body: string; p_title: string }
        Returns: number
      }
      send_gift: {
        Args: { p_amount: number; p_message: string; p_to: string }
        Returns: string
      }
      submit_benefit_request: {
        Args: { _note: string; _package_id: string }
        Returns: {
          auto_approved: boolean
          company_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          note: string | null
          package_id: string | null
          reject_reason: string | null
          status: Database["public"]["Enums"]["benefit_request_status"]
          total_all: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "benefit_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "employee" | "employer" | "provider" | "admin"
      benefit_request_status:
        | "pending"
        | "approved"
        | "rejected"
        | "cancelled"
        | "fulfilled"
      employee_status: "pending" | "active" | "removed"
      offer_status: "draft" | "pending" | "published" | "archived" | "rejected"
      package_status:
        | "draft"
        | "submitted"
        | "approved"
        | "rejected"
        | "fulfilled"
        | "cancelled"
      provider_status: "pending" | "active" | "suspended"
      transaction_status: "pending" | "succeeded" | "refunded" | "failed"
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
      app_role: ["employee", "employer", "provider", "admin"],
      benefit_request_status: [
        "pending",
        "approved",
        "rejected",
        "cancelled",
        "fulfilled",
      ],
      employee_status: ["pending", "active", "removed"],
      offer_status: ["draft", "pending", "published", "archived", "rejected"],
      package_status: [
        "draft",
        "submitted",
        "approved",
        "rejected",
        "fulfilled",
        "cancelled",
      ],
      provider_status: ["pending", "active", "suspended"],
      transaction_status: ["pending", "succeeded", "refunded", "failed"],
    },
  },
} as const
