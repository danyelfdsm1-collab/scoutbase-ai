import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACCOUNT_LABELS, POSITIONS, useSession, type AccountType } from "@/lib/account";
import { CATEGORIES } from "@/lib/scouting";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar ou criar perfil — Scout Base" },
      {
        name: "description",
        content:
          "Acesse o Scout Base como treinador, clube/escolinha ou atleta para avaliar, acompanhar e apresentar talentos do futebol de base.",
      },
      { property: "og:title", content: "Entrar ou criar perfil — Scout Base" },
      {
        property: "og:description",
        content: "Login e cadastro do Scout Base para treinadores, clubes e atletas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthScreen,
});

type Step = "login" | "tipo" | "cadastro";

const FEET = ["Destro", "Canhoto", "Ambidestro"];

function AuthScreen() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [step, setStep] = useState<Step>("login");
  const [accountType, setAccountType] = useState<AccountType>("treinador");
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [city, setCity] = useState("");
  const [uf, setUf] = useState("");
  const [pos1, setPos1] = useState("");
  const [pos2, setPos2] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [foot, setFoot] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    if (session) navigate({ to: "/campo", replace: true });
  }, [session, navigate]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error("Não foi possível entrar. Confira e-mail e senha.");
      return;
    }
    navigate({ to: "/campo", replace: true });
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Não foi possível entrar com o Google.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/campo", replace: true });
  };

  const resetPassword = async () => {
    if (!email.trim()) {
      toast.error("Digite seu e-mail para receber o link.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    if (error) toast.error("Não foi possível enviar o link agora.");
    else toast.success("Enviamos um link de recuperação para o seu e-mail.");
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Use uma senha com pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não são iguais.");
      return;
    }
    if (!username.trim()) {
      toast.error("Escolha um nome de usuário.");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          username: username.trim().toLowerCase(),
          full_name: fullName.trim() || orgName.trim(),
          phone: phone.trim(),
          account_type: accountType,
        },
      },
    });
    if (error || !data.user) {
      setBusy(false);
      toast.error(
        error?.message.includes("already")
          ? "Este e-mail já possui conta. Faça login."
          : "Não foi possível criar a conta.",
      );
      return;
    }

    const patch: Record<string, unknown> = {
      full_name: fullName.trim() || orgName.trim(),
      phone: phone.trim() || null,
      org_name: accountType === "clube" ? orgName.trim() || null : null,
      city: city.trim() || null,
      state: uf.trim().toUpperCase() || null,
    };
    if (accountType === "atleta") {
      Object.assign(patch, {
        birth_date: birthDate || null,
        position_primary: pos1 || null,
        position_secondary: pos2 || null,
        height_cm: height ? Number(height) : null,
        weight_kg: weight ? Number(weight) : null,
        foot: foot || null,
        category: category || null,
      });
    }
    await supabase.from("profiles").update(patch).eq("id", data.user.id);
    setBusy(false);
    toast.success("Perfil criado! Bem-vindo ao Scout Base.");
    navigate({ to: "/campo", replace: true });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="font-display text-4xl tracking-wide text-primary">Scout Base</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Encontre, avalie e acompanhe talentos do futebol de base.
          </p>
        </div>

        {step === "login" && (
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <form onSubmit={signIn} className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" size="lg" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Entrar
              </Button>
            </form>
            <Button variant="link" className="mt-1 h-auto p-0 text-xs" onClick={resetPassword}>
              Esqueci minha senha
            </Button>

            <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              ou
              <span className="h-px flex-1 bg-border" />
            </div>
            <Button variant="outline" className="w-full" onClick={google}>
              Entrar com Google
            </Button>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              Ainda não possui uma conta?
            </p>
            <Button variant="secondary" className="mt-2 w-full" onClick={() => setStep("tipo")}>
              Criar perfil
            </Button>
          </div>
        )}

        {step === "tipo" && (
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Qual é o seu perfil?</h2>
            <div className="mt-4 grid gap-3">
              {(
                [
                  ["treinador", "🧑‍🏫", "Quero encontrar e acompanhar atletas."],
                  ["clube", "🏟️", "Quero divulgar oportunidades e encontrar atletas."],
                  ["atleta", "⚽", "Quero apresentar meu futebol e receber avaliações."],
                ] as [AccountType, string, string][]
              ).map(([value, icon, desc]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setAccountType(value);
                    setStep("cadastro");
                  }}
                  className="rounded-xl border bg-background p-4 text-left transition-colors hover:border-primary"
                >
                  <div className="font-semibold">
                    {icon} Sou {ACCOUNT_LABELS[value]}
                  </div>
                  <div className="text-sm text-muted-foreground">{desc}</div>
                </button>
              ))}
            </div>
            <Button variant="ghost" className="mt-4 w-full" onClick={() => setStep("login")}>
              Voltar
            </Button>
          </div>
        )}

        {step === "cadastro" && (
          <form onSubmit={signUp} className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Criar perfil — {ACCOUNT_LABELS[accountType]}</h2>

            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Dados da conta
            </p>
            <div className="mt-2 grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="user">Nome de usuário</Label>
                <Input
                  id="user"
                  value={username}
                  maxLength={30}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ""))}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="email2">E-mail</Label>
                <Input
                  id="email2"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="pass2">Senha</Label>
                  <Input
                    id="pass2"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="pass3">Confirmar senha</Label>
                  <Input
                    id="pass3"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <p className="mt-5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {accountType === "clube" ? "Dados do clube" : "Dados pessoais"}
            </p>
            <div className="mt-2 grid gap-3">
              {accountType === "clube" && (
                <div className="grid gap-1.5">
                  <Label htmlFor="org">Nome do clube / escolinha</Label>
                  <Input
                    id="org"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="grid gap-1.5">
                <Label htmlFor="name">
                  {accountType === "clube" ? "Nome do responsável" : "Nome completo"}
                </Label>
                <Input
                  id="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={accountType !== "clube"}
                />
              </div>
              <div className="grid grid-cols-[1fr_88px] gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="city">Cidade</Label>
                  <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="uf">UF</Label>
                  <Input
                    id="uf"
                    maxLength={2}
                    value={uf}
                    onChange={(e) => setUf(e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              {accountType === "atleta" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <Label htmlFor="nasc">Data de nascimento</Label>
                      <Input
                        id="nasc"
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Categoria</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-1.5">
                    <Label>Posição principal</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {POSITIONS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPos1(p)}
                          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${
                            pos1 === p
                              ? "border-primary bg-primary text-primary-foreground"
                              : "bg-background text-foreground"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Posição secundária (opcional)</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {POSITIONS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPos2(pos2 === p ? "" : p)}
                          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${
                            pos2 === p
                              ? "border-accent bg-accent text-accent-foreground"
                              : "bg-background text-foreground"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="grid gap-1.5">
                      <Label htmlFor="alt">Altura (cm)</Label>
                      <Input
                        id="alt"
                        inputMode="numeric"
                        value={height}
                        onChange={(e) => setHeight(e.target.value.replace(/\D/g, "").slice(0, 3))}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="peso">Peso (kg)</Label>
                      <Input
                        id="peso"
                        inputMode="numeric"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value.replace(/\D/g, "").slice(0, 3))}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Pé dominante</Label>
                      <Select value={foot} onValueChange={setFoot}>
                        <SelectTrigger>
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          {FEET.map((f) => (
                            <SelectItem key={f} value={f}>
                              {f}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
            </div>

            <Button type="submit" size="lg" className="mt-5 w-full" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar perfil
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="mt-2 w-full"
              onClick={() => setStep("tipo")}
            >
              Voltar
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="underline">
            Voltar para a página inicial
          </Link>
        </p>
      </div>
    </main>
  );
}
