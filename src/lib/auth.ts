import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AppRole | null;
}

export const authService = {
  async getCurrentUser(): Promise<UserProfile | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .eq("id", session.user.id)
      .single();

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    return {
      id: session.user.id,
      email: session.user.email ?? null,
      full_name: profile?.full_name ?? null,
      role: roleData?.role ?? null,
    };
  },

  async signOut() {
    await supabase.auth.signOut();
  }
};
