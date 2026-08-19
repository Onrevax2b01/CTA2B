"use client";

import {
  CircleCheck,
  Flame,
  HeartPulse,
  LifeBuoy,
  Minus,
  Plus,
  Shield,
  Users,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ENGINS, ENGINS_QUANTIFIABLES, type FamilleEngin } from "@/lib/engins";
import { NOMENCLATURE } from "@/lib/nomenclature";
import { cn } from "@/lib/utils";
import type { Engagement, MessageDialogue } from "@/types/jeu";

const ICONES_FAMILLE: Record<FamilleEngin, typeof Flame> = {
  "secours-personnes": HeartPulse,
  incendie: Flame,
  "sauvetage-specialise": LifeBuoy,
  commandement: Shield,
  "concours-exterieur": Users,
};

interface EcranEngagementProps {
  dialogue: MessageDialogue[];
  onValider: (engagement: Engagement) => void;
}

export function EcranEngagement({ dialogue, onValider }: EcranEngagementProps) {
  const [familleChoisie, setFamilleChoisie] = useState("");
  const [motifChoisi, setMotifChoisi] = useState("");
  const [quantites, setQuantites] = useState<Record<string, number>>({});

  const familleObj = NOMENCLATURE.find((f) => f.code === familleChoisie);
  const moyensSelectionnes = Object.entries(quantites).filter(([, q]) => q > 0);
  const peutValider = Boolean(motifChoisi) && moyensSelectionnes.length > 0;

  function choisirFamille(code: string) {
    setFamilleChoisie(code);
    setMotifChoisi("");
  }

  function basculerMoyen(code: string) {
    setQuantites((precedent) => {
      const actuelle = precedent[code] ?? 0;
      return { ...precedent, [code]: actuelle > 0 ? 0 : 1 };
    });
  }

  function changerQuantite(code: string, delta: number) {
    setQuantites((precedent) => ({
      ...precedent,
      [code]: Math.max(0, (precedent[code] ?? 0) + delta),
    }));
  }

  function valider() {
    if (!peutValider) return;
    onValider({
      familleCategorie: familleChoisie,
      motifCategorie: motifChoisi,
      moyens: moyensSelectionnes.map(([code, quantite]) => ({ code, quantite })),
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-6">
      <h1 className="text-lg font-semibold">Engagement</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">
            Dialogue clôturé (consultable, figé)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex max-h-40 flex-col gap-2 overflow-y-auto rounded-md border bg-muted/30 p-3 text-sm">
            {dialogue.map((m) => (
              <p key={m.id}>
                <span className="text-muted-foreground">
                  {m.locuteur === "operateur" ? "Vous : " : "Requérant : "}
                </span>
                {m.texte}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>1. Catégorisation</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row">
          <div className="flex flex-1 flex-col gap-1.5">
            <span className="text-sm font-medium">Famille</span>
            <Select value={familleChoisie} onValueChange={choisirFamille}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une famille" />
              </SelectTrigger>
              <SelectContent>
                {NOMENCLATURE.map((f) => (
                  <SelectItem key={f.code} value={f.code}>
                    {f.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <span className="text-sm font-medium">Motif précis</span>
            <Select
              value={motifChoisi}
              onValueChange={setMotifChoisi}
              disabled={!familleObj}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir un motif" />
              </SelectTrigger>
              <SelectContent>
                {familleObj?.motifs.map((m) => (
                  <SelectItem key={m.code} value={m.code}>
                    {m.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Moyens à engager</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ENGINS.map((engin) => {
              const Icone = ICONES_FAMILLE[engin.famille];
              const quantite = quantites[engin.code] ?? 0;
              const selectionne = quantite > 0;
              const quantifiable = ENGINS_QUANTIFIABLES.has(engin.code);

              return (
                <div
                  key={engin.code}
                  className={cn(
                    "flex flex-col gap-2 rounded-lg border p-3",
                    selectionne && "border-primary bg-accent"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => basculerMoyen(engin.code)}
                    className="flex flex-col gap-2 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <Icone className="size-5 text-muted-foreground" />
                      {selectionne && (
                        <CircleCheck className="size-4 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{engin.code}</p>
                      <p className="text-xs text-muted-foreground">
                        {engin.libelle}
                      </p>
                    </div>
                  </button>

                  {selectionne && quantifiable && (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-6"
                        onClick={() => changerQuantite(engin.code, -1)}
                      >
                        <Minus className="size-3" />
                      </Button>
                      <span className="w-4 text-center text-sm tabular-nums">
                        {quantite}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-6"
                        onClick={() => changerQuantite(engin.code, 1)}
                      >
                        <Plus className="size-3" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" disabled={!peutValider} onClick={valider}>
          Valider le départ
        </Button>
      </div>
    </main>
  );
}
