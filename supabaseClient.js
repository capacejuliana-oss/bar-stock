import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ftnvalrcbmdpjobtuuba.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0bnZhbHJjYm1kcGpvYnR1dWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMjUyMDMsImV4cCI6MjA5ODkwMTIwM30.mLgGDcLVICmjufrkU9a1hBsg4Y1tcBR6YmCsMP-h9-o'

export const supabase = createClient(supabaseUrl, supabaseKey)
