import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AccountType = "treinador" | "clube" | "atleta";

export const ACCOUNT_LABELS: Record<AccountType, string> = {
  treinador: "Treinador",
  clube: "Clube / Escolinha",
  atleta: "Atleta",
};

export const POSITIONS = [
  "Goleiro",
  "Zagueiro",
  "Lateral-D",
  "Lateral-E",
  "Volante",
  "Meia",
  "Ponta-D",
  "Ponta-E",
  "Atacante",
] as const;

export const PLAY_TYPES = [
  "Finalizações",
  "Dribles e 1x1",
  "Passes e assistências",
  "Defesas",
  "Desarmes e marcação",
  "Jogo aéreo",
  "Jogo completo",
] as const;

export const MAX_VIDEOS = 5;
export const MAX_VIDEO_BYTES = 15 * 1024 * 1024;
export const MAX_VIDEO_SECONDS = 60;

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  phone: string | null;
  account_type: AccountType;
  org_name: string | null;
  birth_date: string | null;
  city: string | null;
  state: string | null;
  position_primary: string | null;
  position_secondary: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  foot: string | null;
  category: string | null;
  photo_url: string | null;
  bio: string | null;
}

export interface AthleteVideo {
  id: string;
  athlete_id: string;
  title: string;
  play_type: string | null;
  position: string | null;
  competition: string | null;
  played_on: string | null;
  description: string | null;
  duration_seconds: number | null;
  size_bytes: number | null;
  storage_path: string;
  created_at: string;
}

export interface AthleteEvaluation {
  id: string;
  athlete_id: string;
  summary: string | null;
  scores: Record<string, number>;
  source: string;
  created_at: string;
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, loading, user: session?.user ?? null };
}

export function useMyProfile() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });
}

export function ageFrom(birthDate?: string | null) {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}
