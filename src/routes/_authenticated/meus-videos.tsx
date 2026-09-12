import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ArrowLeft, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MAX_VIDEOS,
  MAX_VIDEO_BYTES,
  MAX_VIDEO_SECONDS,
  PLAY_TYPES,
  POSITIONS,
  useMyProfile,
  useSession,
  type AthleteVideo,
} from "@/lib/account";

export const Route = createFileRoute("/_authenticated/meus-videos")({
  head: () => ({
    meta: [
      { title: "Meus vídeos — Scout Base" },
      {
        name: "description",
        content:
          "Envie até 5 vídeos de até 1 minuto com título, tipo de lance, posição e campeonato para apresentar seu futebol.",
      },
      { property: "og:title", content: "Meus vídeos — Scout Base" },
      {
        property: "og:description",
        content: "Gerencie os vídeos do seu card de atleta no Scout Base.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MyVideos,
});

function readDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement("video");
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Math.round(el.duration || 0));
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    el.src = url;
  });
}

function MyVideos() {
  const { user } = useSession();
  const { data: profile } = useMyProfile();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [playType, setPlayType] = useState("");
  const [position, setPosition] = useState("");
  const [competition, setCompetition] = useState("");
  const [playedOn, setPlayedOn] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: videos } = useQuery({
    queryKey: ["my-videos", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("athlete_videos")
        .select("*")
        .eq("athlete_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AthleteVideo[];
    },
  });

  const used = videos?.length ?? 0;

  const pick = async (f: File | null) => {
    if (!f) return;
    if (f.size > MAX_VIDEO_BYTES) {
      toast.error("Vídeo acima de 15 MB. Envie um trecho menor.");
      return;
    }
    const seconds = await readDuration(f);
    if (seconds > MAX_VIDEO_SECONDS + 1) {
      toast.error("O vídeo deve ter no máximo 1 minuto.");
      return;
    }
    setFile(f);
  };

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;
    if (used >= MAX_VIDEOS) {
      toast.error("Você já atingiu o limite de 5 vídeos. Apague um para enviar outro.");
      return;
    }
    setBusy(true);
    const seconds = await readDuration(file);
    const ext = file.name.split(".").pop() || "mp4";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("athlete-videos")
      .upload(path, file, { contentType: file.type });
    if (upErr) {
      setBusy(false);
      toast.error("Não foi possível enviar o vídeo.");
      return;
    }
    const { error } = await supabase.from("athlete_videos").insert({
      athlete_id: user.id,
      title: title.trim() || "Vídeo",
      play_type: playType || null,
      position: position || profile?.position_primary || null,
      competition: competition.trim() || null,
      played_on: playedOn || null,
      description: description.trim() || null,
      duration_seconds: seconds,
      size_bytes: file.size,
      storage_path: path,
    });
    setBusy(false);
    if (error) {
      await supabase.storage.from("athlete-videos").remove([path]);
      toast.error("Não foi possível salvar o vídeo.");
      return;
    }
    toast.success("Vídeo enviado.");
    setFile(null);
    setTitle("");
    setPlayType("");
    setCompetition("");
    setPlayedOn("");
    setDescription("");
    if (fileRef.current) fileRef.current.value = "";
    qc.invalidateQueries({ queryKey: ["my-videos", user.id] });
  };

  const remove = async (video: AthleteVideo) => {
    await supabase.storage.from("athlete-videos").remove([video.storage_path]);
    await supabase.from("athlete_videos").delete().eq("id", video.id);
    toast.success("Vídeo removido.");
    qc.invalidateQueries({ queryKey: ["my-videos", user?.id] });
  };

  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <header className="mb-5 flex items-center gap-3">
          <Link
            to="/campo"
            className="flex h-9 w-9 items-center justify-center rounded-full border bg-card text-muted-foreground"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-3xl tracking-wide text-primary">Meus vídeos</h1>
            <p className="text-sm text-muted-foreground">
              Até {MAX_VIDEOS} vídeos, 1 minuto e 15 MB cada.
            </p>
          </div>
        </header>

        <div className="mb-5 rounded-xl border bg-card p-4">
          <div className="flex justify-between text-sm font-semibold">
            <span>Vídeos utilizados</span>
            <span>
              {used}/{MAX_VIDEOS}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${(used / MAX_VIDEOS) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={upload} className="grid gap-3 rounded-xl border bg-card p-4">
          <div className="grid gap-1.5">
            <Label htmlFor="arq">Arquivo do vídeo</Label>
            <Input
              id="arq"
              ref={fileRef}
              type="file"
              accept="video/*"
              onChange={(e) => pick(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tit">Título</Label>
            <Input
              id="tit"
              value={title}
              maxLength={80}
              placeholder="Vídeo 01 — Finalizações"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Tipo de lance</Label>
              <Select value={playType} onValueChange={setPlayType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {PLAY_TYPES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Posição no lance</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="camp">Campeonato / partida</Label>
              <Input
                id="camp"
                value={competition}
                onChange={(e) => setCompetition(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={playedOn}
                onChange={(e) => setPlayedOn(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="desc">Descrição (opcional)</Label>
            <Textarea
              id="desc"
              rows={2}
              maxLength={400}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={busy || !file || used >= MAX_VIDEOS}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Enviar vídeo
          </Button>
        </form>

        <div className="mt-5 grid gap-3">
          {(videos ?? []).map((v) => (
            <div key={v.id} className="flex items-start justify-between gap-3 rounded-xl border bg-card p-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{v.title}</p>
                <p className="text-xs text-muted-foreground">
                  {[v.play_type, v.position, v.competition].filter(Boolean).join(" | ")}
                  {v.duration_seconds
                    ? ` • ${String(Math.floor(v.duration_seconds / 60)).padStart(2, "0")}:${String(
                        v.duration_seconds % 60,
                      ).padStart(2, "0")}`
                    : ""}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(v)} aria-label="Remover vídeo">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {profile && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Seu card público:{" "}
            <Link
              to="/perfil/$username"
              params={{ username: profile.username }}
              className="underline"
            >
              /perfil/{profile.username}
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
