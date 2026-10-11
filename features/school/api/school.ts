import { supabase } from "@/shared/libs/supabase";

export interface Campus {
  id: string;
  name: string;
  city?: string | null;
  state?: string | null;
}

// RLS limits both queries to the signed-in staff member's own school.
export const fetchCampuses = async (): Promise<Campus[]> => {
  const { data, error } = await supabase
    .from("campuses")
    .select("id, name, city, state")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
};
