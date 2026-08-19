"use client";

import {
  CircleAlert,
  CircleQuestionMark,
  Clock,
  FaceAngry,
  FaceSlightlySmiling,
  PhoneOff,
  Siren,
} from "lucide-react";
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
import type { EtatEmotionnel } from "@/types/scenario";
import {
  ficheAlerteVide,
  type FicheAlerte,
  type MessageDialogue,
  type ReponseRequerant,
} from "@/types/jeu";

function idMessage(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formaterDuree(ms: number): string {
  const secondesTotales = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(secondesTotales / 60);
  const secondes = secondesTotales % 60;
  return `${minutes.toString().padStart(2, "0")}:${secondes
    .toString()
    .padStart(2, "0")}`;
}

const ETATS_EMOTIONNELS: Record<
  EtatEmotionnel,
  { libelle: string; Icone: typeof CircleAlert; classe: string }
> = {
  calme: { libelle: "Calme", Icone: FaceSlightlySmiling, classe: "text-success" },
  inquiet: { libelle: "Inquiet", Icone: CircleAlert, classe: "text-warning" },
  paniqué: { libelle: "Paniqué", Icone: Siren, classe: "text-destructive" },
  agressif: { libelle: "Agressif", Icone: FaceAngry, classe: "text-destructive" },
  confus: {
    libelle: "Confus",
    Icone: CircleQuestionMark,
    classe: "text-muted-foreground",
  },
};

// Aide optionnelle : injecte une question type dans le champ de saisie,
// ne l'envoie jamais automatiquement. Désactivable par l'opérateur.
const QUESTIONS_RAPIDES = [
  { label: "Adresse ?", question: "Quelle est votre adresse ?" },
  { label: "Numéro de rappel ?", question: "Quel est votre numéro de rappel ?" },
  { label: "Conscient ?", question: "Est-ce que la personne est consciente ?" },
  { label: "Respire ?", question: "Est-ce que la personne respire ?" },
  {
    label: "Combien de victimes ?",
    question: "Combien de personnes sont concernées ?",
  },
];

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
  const [appelInterrompu, setAppelInterrompu] = useState(false);
  const [etatEmotionnel, setEtatEmotionnel] = useState<EtatEmotionnel>("calme");
  const [aideVisible, setAideVisible] = useState(true);
  const [ficheAlerte, setFicheAlerte] = useState<FicheAlerte>(ficheAlerteVide);
  const [secondesEcoulees, setSecondesEcoulees] = useState(0);
  const finDialogueRef = useRef<HTMLDivElement | null>(null);
  const saisieRef = useRef<HTMLInputElement | null>(null);

  // Chrono depuis le décrochage : tourne en continu, visible en permanence,
  // et s'arrête à la clôture de l'appel. Un compteur de secondes (plutôt
  // qu'un horodatage absolu) évite tout appel impur (Date.now()) pendant
  // le rendu.
  useEffect(() => {
    if (appelClos) return;
    const intervalle = setInterval(
      () => setSecondesEcoulees((s) => s + 1),
      1000
    );
    return () => clearInterval(intervalle);
  }, [appelClos]);

  // Charge la réplique d'ouverture du requérant au décrochage.
  useEffect(() => {
    let annule = false;

    fetch(`/api/scenarios/${scenarioId}/ouverture`)
      .then((reponse) => reponse.json())
      .then((ouverture: ReponseRequerant) => {
        if (annule) return;
        setEtatEmotionnel(ouverture.etatEmotionnel);
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

  function ajouterMessageRequerant(texte: string) {
    setDialogue((precedent) => [
      ...precedent,
      {
        id: idMessage(),
        locuteur: "requerant",
        texte,
        horodatage: secondesEcoulees * 1000,
      },
    ]);
  }

  async function envoyerQuestion(texteforce?: string) {
    const texte = (texteforce ?? saisie).trim();
    if (!texte || appelClos || appelInterrompu || envoiEnCours) return;

    const historiqueAvant = dialogue;

    setDialogue((precedent) => [
      ...precedent,
      {
        id: idMessage(),
        locuteur: "operateur",
        texte,
        horodatage: secondesEcoulees * 1000,
      },
    ]);
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

      setEtatEmotionnel(reponse.etatEmotionnel);
      ajouterMessageRequerant(reponse.reponse);

      if (reponse.evenement) {
        window.setTimeout(() => ajouterMessageRequerant(reponse.evenement!), 900);
      }

      if (reponse.raccrocheOuPerdReseau) {
        setAppelInterrompu(true);
      }
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

  function injecterQuestionRapide(question: string) {
    setSaisie(question);
    saisieRef.current?.focus();
  }

  const dureeAffichee = formaterDuree(secondesEcoulees * 1000);
  const infosEtat = ETATS_EMOTIONNELS[etatEmotionnel];
  const IconeEtat = infosEtat.Icone;
  const saisieDesactivee =
    appelClos || appelInterrompu || enChargement || envoiEnCours;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-6">
      <h1 className="text-lg font-semibold">{libelleNeutre}</h1>

      <div className="flex flex-1 flex-col gap-4 md:flex-row">
        {/* Colonne gauche : fiche d'alerte, remplie manuellement. */}
        <Card className="md:w-72 md:shrink-0">
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

        {/* Colonne centrale : dialogue avec le requérant. */}
        <Card className="min-w-0 flex-1">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Dialogue avec le requérant
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex max-h-[55vh] min-h-[45vh] flex-col gap-3 overflow-y-auto rounded-md border bg-muted/30 p-3">
              {enChargement && (
                <p className="text-sm text-muted-foreground">
                  Décrochage en cours...
                </p>
              )}
              {dialogue.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex max-w-[85%] flex-col gap-0.5",
                    message.locuteur === "requerant" ? "self-start" : "self-end"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm",
                      message.locuteur === "requerant"
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-primary text-primary-foreground"
                    )}
                  >
                    {message.texte}
                  </div>
                  <span
                    className={cn(
                      "text-[11px] text-muted-foreground",
                      message.locuteur === "requerant" ? "text-left" : "text-right"
                    )}
                  >
                    {formaterDuree(message.horodatage)}
                  </span>
                </div>
              ))}
              {envoiEnCours && (
                <p className="self-start text-xs text-muted-foreground">
                  Le requérant répond...
                </p>
              )}
              <div ref={finDialogueRef} />
            </div>

            {aideVisible && (
              <div className="flex flex-wrap items-center gap-1.5">
                {QUESTIONS_RAPIDES.map((qr) => (
                  <Button
                    key={qr.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={saisieDesactivee}
                    onClick={() => injecterQuestionRapide(qr.question)}
                  >
                    {qr.label}
                  </Button>
                ))}
                <button
                  type="button"
                  className="ml-auto text-xs text-muted-foreground underline-offset-2 hover:underline"
                  onClick={() => setAideVisible(false)}
                >
                  Masquer l&apos;aide
                </button>
              </div>
            )}
            {!aideVisible && (
              <button
                type="button"
                className="self-start text-xs text-muted-foreground underline-offset-2 hover:underline"
                onClick={() => setAideVisible(true)}
              >
                Afficher les questions rapides
              </button>
            )}

            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void envoyerQuestion();
              }}
            >
              <Input
                ref={saisieRef}
                value={saisie}
                onChange={(e) => setSaisie(e.target.value)}
                placeholder="Posez votre question au requérant..."
                disabled={saisieDesactivee}
              />
              <Button type="submit" disabled={saisieDesactivee || !saisie.trim()}>
                Envoyer
              </Button>
            </form>

            {appelInterrompu && !appelClos && (
              <p className="flex items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                <PhoneOff className="size-4 shrink-0" />
                Le requérant a raccroché ou a perdu le réseau. Vous pouvez
                clore l&apos;appel avec les éléments recueillis.
              </p>
            )}

            {appelClos && (
              <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                Appel clôturé. L&apos;écran d&apos;engagement et le débriefing
                seront ajoutés dans une prochaine étape de construction.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Colonne droite : bandeau de situation. */}
        <Card className="md:w-64 md:shrink-0">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Situation
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="size-4" />
                Chrono
              </span>
              <span className="font-mono text-lg tabular-nums">
                {dureeAffichee}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tours</span>
              <Badge variant="outline">{nombreDeTours}</Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Requérant</span>
              <span className={cn("flex items-center gap-1.5 text-sm", infosEtat.classe)}>
                <IconeEtat className="size-4" />
                {infosEtat.libelle}
              </span>
            </div>

            <Button
              variant="destructive"
              disabled={appelClos}
              onClick={() => setAppelClos(true)}
              className="w-full"
            >
              Clore l&apos;appel et engager
            </Button>
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
