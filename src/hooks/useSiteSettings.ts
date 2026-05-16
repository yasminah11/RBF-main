import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSiteSettings(id: string) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: row } = await supabase
        .from("site_settings")
        .select("value")
        .eq("id", id)
        .single();
      if (row) setData(row.value);
      setIsLoading(false);
    };
    fetch();
  }, [id]);

  return { data, isLoading };
}

export async function updateSiteSettings(id: string, value: any) {
  const { error } = await supabase
    .from("site_settings")
    .update({ value, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
