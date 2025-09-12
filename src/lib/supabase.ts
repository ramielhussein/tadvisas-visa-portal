import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://anffzihqpbcfmrubdnon.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuZmZ6aWhxcGJjZm1ydWJkbm9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MDk2MjIsImV4cCI6MjA2NzQ4NTYyMn0.Z1BQD6rtO9Tj_dRk1Bh7HnlO156BH5aCUVTAG6Y-P6k'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)