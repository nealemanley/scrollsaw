import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://houpptvrprpadsmimezw.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvdXBwdHZycHJwYWRzbWltZXp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NDYxMTksImV4cCI6MjA4ODAyMjExOX0.jq6vssbve2zJr2OcNFJ-t05e-ciPZA0SOTFT0mix8EA"
);
