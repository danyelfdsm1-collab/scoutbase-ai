import { createServerFn } from "@tanstack/react-start";

/**
 * Gera links temporários para os vídeos de um atleta.
 * Os vídeos do atleta são públicos no card de perfil, mas ficam
 * armazenados em área privada — por isso os links são assinados aqui.
 */
export const getVideoUrls = createServerFn({ method: "POST" })
  .inputValidator((input: { paths: string[] }) => ({
    paths: (input.paths ?? []).filter((p) => typeof p === "string").slice(0, 5),
  }))
  .handler(async ({ data }) => {
    if (!data.paths.length) return { urls: {} as Record<string, string> };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const urls: Record<string, string> = {};
    for (const path of data.paths) {
      const { data: signed } = await supabaseAdmin.storage
        .from("athlete-videos")
        .createSignedUrl(path, 60 * 60);
      if (signed?.signedUrl) urls[path] = signed.signedUrl;
    }
    return { urls };
  });
