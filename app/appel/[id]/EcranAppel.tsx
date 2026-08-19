"use client";

import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ficheAlerteVide,
  type FicheAlerte,
  type MessageDialogue,
  type ReponseRequerant,
} from "@/types/jeu";

function idMessage(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface EcranAppelProps {
  scenarioId: string;
  libelleNeutre: string;
}

export function EcranAppel({ scenarioId, libelleNeutre }: EcranAppelProps) {
  const [dialogue, setDialogue] = useState<MessageDialogue[]>([]);
  const [saisie, setSaisie] = useState("");
  const [enChargement, setEnChargement] = useState(true);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [appelClos, setAppelClos] = useState(false);
  const [ficheAlerte, setFicheAlerte] = useState<FicheAlerte>(ficheAlerteVide);
  const finDialogueRef = useRef<HTMLDivElement | null>(null);

  // Charge la réplique d'ouverture du requérant au décrochage.
  useEffect(() => {
    let annule = false;

    fetch(`/api/scenarios/${scenarioId}/ouverture`)
      .then((reponse) => reponse.json())
      .then((ouverture: ReponseRequerant) => {
        if (annule) return;
        setDialogue([
          {
            id: idMessage(),
            locuteur: "requerant",
            texte: ouverture.reponse,
            horodatage: 0,
          },
        ]);
      })
      .finally(() => {
        if (!annule) setEnChargement(false);
      });

    return () => {
      annule = true;
    };
  }, [scenarioId]);

  useEffect(() => {
    finDialogueRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dialogue]);

  const nombreDeTours = dialogue.filter((m) => m.locuteur === "operateur")
    .length;

  async function envoyerQuestion() {
    const texte = saisie.trim();
    if (!texte || appelClos || envoiEnCours) return;

    const historiqueAvant = dialogue;
    const messageOperateur: MessageDialogue = {
      id: idMessage(),
      locuteur: "operateur",
      texte,
      horodatage: Date.now(),
    };

    setDialogue((precedent) => [...precedent, messageOperateur]);
    setSaisie("");
    setEnvoiEnCours(true);

    try {
      const reponseApi = await fetch("/api/dialogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId,
          saisieOperateur: texte,
          historique: historiqueAvant,
        }),
      });
      const reponse = (await reponseApi.json()) as ReponseRequerant;

      setDialogue((precedent) => [
        ...precedent,
        {
          id: idMessage(),
          locuteur: "requerant",
          texte: reponse.reponse,
          horodatage: Date.now(),
          infosReveleesIds: reponse.infosReveleesIds,
        },
      ]);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  function mettreAJourFiche<K extends keyof FicheAlerte>(
    champ: K,
    valeur: string
  ) {
    setFicheAlerte((precedente) => ({ ...precedente, [champ]: valeur }));
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{libelleNeutre}</h1>
        <div className="flex items-center gap-3">
          <Badge variant="outline">{nombreDeTours} question(s) posée(s)</Badge>
          <Button
            variant="destructive"
            disabled={appelClos}
            onClick={() => setAppelClos(true)}
          >
            Clore l&apos;appel et engager
          </Button>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Dialogue avec le requérant
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex max-h-[50vh] min-h-[40vh] flex-col gap-3 overflow-y-auto rounded-md border bg-muted/30 p-3">
              {enChargement && (
                <p className="text-sm text-muted-foreground">
                  Décrochage en cours...
                </p>
              )}
              {dialogue.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                    message.locuteur === "requerant"
                      ? "self-start bg-secondary text-secondary-foreground"
                      : "self-end bg-primary text-primary-foreground"
                  )}
                >
                  {message.texte}
                </div>
              ))}
              {envoiEnCours && (
                <p className="self-start text-xs text-muted-foreground">
                  Le requérant répond...
                </p>
              )}
              <div ref={finDialogueRef} />
            </div>

            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void envoyerQuestion();
              }}
            >
              <Input
                value={saisie}
                onChange={(e) => setSaisie(e.target.value)}
                placeholder="Posez votre question au requérant..."
                disabled={appelClos || enChargement}
              />
              <Button
                type="submit"
                disabled={appelClos || enChargement || !saisie.trim()}
              >
                Envoyer
              </Button>
            </form>

            {appelClos && (
              <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                Appel clôturé. L&apos;écran d&apos;engagement et le débriefing
                seront ajoutés dans une prochaine étape de construction.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Fiche d&apos;alerte (à remplir vous-même)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <ChampFiche
              id="adresse"
              label="Adresse"
              valeur={ficheAlerte.adresse}
              onChange={(v) => mettreAJourFiche("adresse", v)}
              disabled={appelClos}
            />
            <ChampFiche
              id="commune"
              label="Commune"
              valeur={ficheAlerte.commune}
              onChange={(v) => mettreAJourFiche("commune", v)}
              disabled={appelClos}
            />
            <ChampFiche
              id="precisionsAcces"
              label="Précisions d'accès"
              valeur={ficheAlerte.precisionsAcces}
              onChange={(v) => mettreAJourFiche("precisionsAcces", v)}
              disabled={appelClos}
            />
            <ChampFiche
              id="numeroRappel"
              label="Numéro de rappel"
              valeur={ficheAlerte.numeroRappel}
              onChange={(v) => mettreAJourFiche("numeroRappel", v)}
              disabled={appelClos}
            />
            <ChampFiche
              id="nature"
              label="Nature"
              valeur={ficheAlerte.nature}
              onChange={(v) => mettreAJourFiche("nature", v)}
              disabled={appelClos}
            />
            <ChampFiche
              id="nbVictimes"
              label="Nombre de victimes"
              valeur={ficheAlerte.nbVictimes}
              onChange={(v) => mettreAJourFiche("nbVictimes", v)}
              disabled={appelClos}
            />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="risques">Risques particuliers</Label>
              <Textarea
                id="risques"
                value={ficheAlerte.risques}
                onChange={(e) => mettreAJourFiche("risques", e.target.value)}
                disabled={appelClos}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function ChampFiche({
  id,
  label,
  valeur,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  valeur: string;
  onChange: (valeur: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
}
