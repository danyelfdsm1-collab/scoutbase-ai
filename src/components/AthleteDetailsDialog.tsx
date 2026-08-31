import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, type Athlete, type Category, type Foot } from "@/lib/scouting";

const FEET: Foot[] = ["Destro", "Canhoto", "Ambidestro"];

export function AthleteDetailsDialog({
  open,
  onOpenChange,
  athlete,
  onSave,
  onRemove,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  athlete: Athlete;
  onSave: (athlete: Athlete) => void;
  onRemove: () => void;
}) {
  const [form, setForm] = useState<Athlete>(athlete);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setForm(athlete);
  }, [open, athlete]);

  const set = <K extends keyof Athlete>(key: K, value: Athlete[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const pickPhoto = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set("photo", String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhes do atleta</DialogTitle>
          <DialogDescription>Dados cadastrais para a ficha de observação.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-accent bg-muted"
          >
            {form.photo ? (
              <img src={form.photo} alt="Foto do atleta" className="h-full w-full object-cover" />
            ) : (
              <Camera className="h-6 w-6 text-muted-foreground" />
            )}
          </button>
          <div className="min-w-0 text-sm text-muted-foreground">
            Toque na foto para enviar uma imagem do atleta.
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pickPhoto(e.target.files?.[0])}
          />
        </div>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="fullName">Nome completo</Label>
            <Input
              id="fullName"
              maxLength={100}
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="birthDate">Data de nascimento</Label>
              <Input
                id="birthDate"
                type="date"
                value={form.birthDate}
                onChange={(e) => set("birthDate", e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Categoria</Label>
              <Select
                value={form.category}
                onValueChange={(v) => set("category", v as Category)}
              >
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
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Pé dominante</Label>
              <Select value={form.foot} onValueChange={(v) => set("foot", v as Foot)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
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
            <div className="grid gap-1.5">
              <Label htmlFor="position">Posição</Label>
              <Input
                id="position"
                value={form.position}
                onChange={(e) => set("position", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="height">Altura (cm)</Label>
              <Input
                id="height"
                inputMode="numeric"
                value={form.heightCm}
                onChange={(e) => set("heightCm", e.target.value.replace(/\D/g, "").slice(0, 3))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                inputMode="numeric"
                value={form.weightKg}
                onChange={(e) => set("weightKg", e.target.value.replace(/\D/g, "").slice(0, 3))}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="ghost" onClick={onRemove}>
            Limpar posição
          </Button>
          <Button
            onClick={() => onSave({ ...form, fullName: form.fullName.trim() })}
            disabled={!form.fullName.trim()}
          >
            Salvar dados
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
