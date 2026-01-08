import { supabase } from "@/integrations/supabase/client";

export async function fetchProfileNameMap(userIds: Array<string | null | undefined>) {
  const ids = Array.from(new Set(userIds.filter((id): id is string => typeof id === "string" && id.length > 0)));
  if (ids.length === 0) return {} as Record<string, string>;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", ids);

  if (error) throw error;

  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    map[row.id] = row.full_name ?? "";
  }
  return map;
}
