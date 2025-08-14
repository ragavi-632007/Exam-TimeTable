import { supabase } from "../lib/supabase";

export const getSubjectCount = async () => {
  const { count, error } = await supabase
    .from("subject_detail")
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  return count || 0;
};
