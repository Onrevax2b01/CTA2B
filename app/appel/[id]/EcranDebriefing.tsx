"use client";

import { CircleAlert, CircleCheck, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { PertinenceQuestion, ResultatDebriefing } from "@/types/debriefing";

const LIBELLES_AXES = {
  informationsVitales: "Informations vitales",
  bilanVictimes: "Bilan des victimes",
  conseilsDeSauvegarde: "Conseils de sauvegarde",
  categorisation: "Catégorisation",
  adequationMoyens: "Adéquation des moyens",
} as const;

const LIBELLES_PERTINENCE: Record<PertinenceQuestion, string> = {
  pertinente: "Pertinente",
  inutile: "Inutile (déjà obtenu)",
  hors_sujet: "Hors sujet",
};

const CLASSES_PERTINENCE: Record<PertinenceQuestion, string> = {
  pertinente: "border-transparent bg-success/15 text-success",
  inutile: "border-transparent bg-warning/15 text-warning",
  hors_sujet: "border-transparent bg-destructive/15 text-destructive",
};

interface EcranDebriefingProps {
  resultat: ResultatDebriefing;
  onRejouer: () => void;
  onAppelSuivant: () => void;
}

export function EcranDebriefing({
  resultat,
  onRejouer,
  onAppelSuivant,
}: EcranDebriefingProps) {
  const { score } = resultat;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-6">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Débriefing — {resultat.titreReel}</h1>
        <p className="text-sm text-muted-foreground">{resultat.natureReelle}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-baseline gap-2">
            Score global
            <span className="text-3xl font-bold tabular-nums">{score.total}</span>
            <span className="text-muted-foreground">/100</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {(Object.keys(LIBELLES_AXES) as (keyof typeof LIBELLES_AXES)[]).map(
            (cle) => {
              const axe = score.axes[cle];
              return (
                <div key={cle} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{LIBELLES_AXES[cle]}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {axe.points}/{axe.surMax}
                    </span>
                  </div>
                  <Progress value={(axe.points / axe.surMax) * 100} />
                </div>
              );
            }
          )}

          {score.malus.length > 0 && (
            <div className="mt-2 flex flex-col gap-1 rounded-md border border-dashed p-3">
              <p className="text-sm font-medium text-destructive">
                Malus appliqués
              </p>
              {score.malus.map((m) => (
                <p key={m.motif} className="text-sm text-muted-foreground">
                  − {m.points} pt(s) : {m.motif}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dialogue rejoué et annoté</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {resultat.dialogueAnnote.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex max-w-[85%] flex-col gap-1",
                m.locuteur === "requerant" ? "self-start" : "self-end items-end"
              )}
            >
              <div
                className={cn(
                  "rounded-lg px-3 py-2 text-sm",
                  m.locuteur === "requerant"
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-primary text-primary-foreground"
                )}
              >
                {m.texte}
              </div>
              {m.pertinence && (
                <Badge className={CLASSES_PERTINENCE[m.pertinence]}>
                  {LIBELLES_PERTINENCE[m.pertinence]}
                </Badge>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations jamais obtenues</CardTitle>
        </CardHeader>
        <CardContent>
          {resultat.informationsJamaisObtenues.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-success">
              <CircleCheck className="size-4" />
              Toutes les informations clés ont été recueillies.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {resultat.informationsJamaisObtenues.map((info) => (
                <li
                  key={info.id}
                  className="flex items-center gap-2 text-sm text-destructive"
                >
                  <CircleAlert className="size-4 shrink-0" />
                  {info.libelle}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conseils de sauvegarde</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          {resultat.conseilsDeSauvegardeAttendus.map((conseil) => {
            const donne = resultat.conseilsDonnes.includes(conseil);
            return (
              <p
                key={conseil}
                className={cn(
                  "flex items-center gap-2 text-sm",
                  donne ? "text-success" : "text-destructive"
                )}
              >
                {donne ? (
                  <CircleCheck className="size-4 shrink-0" />
                ) : (
                  <CircleAlert className="size-4 shrink-0" />
                )}
                {conseil}
              </p>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catégorisation</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5 text-sm">
          <p>
            Choisie : <span className="font-medium">{resultat.categorisation.motifChoisi}</span>
          </p>
          <p>
            Attendue :{" "}
            <span className="font-medium">{resultat.categorisation.motifAttendu}</span>
          </p>
          {resultat.categorisation.motifCorrect ? (
            <p className="flex items-center gap-2 text-success">
              <CircleCheck className="size-4" /> Catégorisation exacte.
            </p>
          ) : resultat.categorisation.motifAcceptable ? (
            <p className="flex items-center gap-2 text-warning">
              <TriangleAlert className="size-4" /> Motif différent mais toléré.
            </p>
          ) : (
            <p className="flex items-center gap-2 text-destructive">
              <CircleAlert className="size-4" /> Catégorisation incorrecte.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comparatif d&apos;engagement</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {resultat.sousEngagement && (
            <p className="flex items-center gap-2 text-sm text-destructive">
              <CircleAlert className="size-4 shrink-0" />
              Sous-engagement : au moins un moyen attendu n&apos;a pas été envoyé.
            </p>
          )}
          {resultat.surEngagement && (
            <p className="flex items-center gap-2 text-sm text-warning">
              <TriangleAlert className="size-4 shrink-0" />
              Sur-engagement : au moins un moyen excessif a été envoyé.
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-1.5 pr-2 font-medium">Moyen</th>
                  <th className="py-1.5 pr-2 font-medium">Envoyé</th>
                  <th className="py-1.5 pr-2 font-medium">Attendu</th>
                  <th className="py-1.5 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {resultat.comparatifMoyens.map((moyen) => (
                  <tr key={moyen.code} className="border-b last:border-0">
                    <td className="py-1.5 pr-2">
                      {moyen.code} — {moyen.libelle}
                    </td>
                    <td className="py-1.5 pr-2 tabular-nums">
                      {moyen.quantiteEnvoyee > 0 ? moyen.quantiteEnvoyee : "—"}
                    </td>
                    <td className="py-1.5 pr-2">{moyen.attendu ? "Oui" : "—"}</td>
                    <td className="py-1.5">
                      {moyen.excessif && moyen.quantiteEnvoyee > 0 ? (
                        <Badge variant="warning">Excessif</Badge>
                      ) : moyen.attendu && moyen.quantiteEnvoyee === 0 ? (
                        <Badge variant="destructive">Manquant</Badge>
                      ) : moyen.quantiteEnvoyee > 0 ? (
                        <Badge variant="success">Envoyé</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vérité terrain complète</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5 text-sm">
          <p>
            <span className="text-muted-foreground">Adresse : </span>
            {resultat.verite.adresse}, {resultat.verite.commune}
          </p>
          <p>
            <span className="text-muted-foreground">Accès : </span>
            {resultat.verite.precisionsAcces}
          </p>
          <p>
            <span className="text-muted-foreground">Numéro de rappel : </span>
            {resultat.verite.numeroRappel}
          </p>
          <p>
            <span className="text-muted-foreground">Nature réelle : </span>
            {resultat.verite.natureReelle}
          </p>
          <p>
            <span className="text-muted-foreground">Victimes : </span>
            {resultat.verite.nbVictimes}
          </p>
          {resultat.verite.victimes.map((v, i) => (
            <p key={i} className="pl-4 text-muted-foreground">
              Victime {i + 1} : {v.age}, {v.sexe} — conscience : {v.conscience} —
              respiration : {v.respiration} — hémorragie : {v.hemorragie}
            </p>
          ))}
          <p>
            <span className="text-muted-foreground">Risques : </span>
            {resultat.verite.risques.join(", ") || "aucun"}
          </p>
          <p>
            <span className="text-muted-foreground">Environnement : </span>
            {resultat.verite.environnement}
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 pb-6">
        <Button variant="outline" onClick={onRejouer}>
          Rejouer ce scénario
        </Button>
        <Button onClick={onAppelSuivant}>Appel suivant</Button>
      </div>
    </main>
  );
}
