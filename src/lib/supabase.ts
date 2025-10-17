import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uwncpnveatbwnsgepjlb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3bmNwbnZlYXRid25zZ2VwamxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MzQ0MDQsImV4cCI6MjA3NjIxMDQwNH0.QHyurH257zNQ5HnKwwzpViuWzr_jPFOxtEAFRElOx2Y'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)