
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://dvpfwmmicigarxtutyqf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2cGZ3bW1pY2lnYXJ4dHV0eXFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxMDU1NzgsImV4cCI6MjA1ODY4MTU3OH0.PqQMUYaUqh7OQNy_zC29hZQ-DCD_Ht_kFYPdVPYeHMU";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      storage: localStorage,
      autoRefreshToken: true,
    }
  }
);
