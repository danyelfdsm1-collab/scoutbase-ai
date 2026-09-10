import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/redefinir-senha")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — Scout Base" },
      { name: "description", content: "Defina uma nova senha para acessar sua conta no Scout Base." },
      { property: "og:title", content: "Redefinir senha — Scout Base" },
      { property: "og:description", content: "Criação de nova senha de acesso ao Scout Base." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Use uma senha com pelo menos 8 caracteres.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error("Não foi possível alterar a senha. Peça um novo link.");
      return;
    }
    toast.success("Senha alterada.");
    navigate({ to: "/campo", replace: true });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={save} className="w-full max-w-sm rounded-2xl border bg-card p-5">
        <h1 className="font-display text-2xl tracking-wide text-primary">Nova senha</h1>
        <div className="mt-4 grid gap-1.5">
          <Label htmlFor="np">Senha</Label>
          <Input
            id="np"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="mt-4 w-full" disabled={busy}>
          Salvar senha
        </Button>
      </form>
    </main>
  );
}
