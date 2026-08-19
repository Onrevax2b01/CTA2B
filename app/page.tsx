import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listerResumes } from "@/lib/scenarios";

export default function PageAccueil() {
  const scenarios = listerResumes();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-10">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">
          CTA2B — Simulateur de traitement de l&apos;alerte
        </h1>
        <p className="text-muted-foreground text-sm">
          Décrochez un appel, menez l&apos;interrogatoire, engagez les bons
          moyens.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Entraînement libre</CardTitle>
          <CardDescription>
            Un appel est tiré au hasard parmi tous les scénarios disponibles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="lg" className="w-full">
            <Link href="/appel/aleatoire">Tirage aléatoire</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Choisir un appel</CardTitle>
          <CardDescription>
            Le contenu réel de l&apos;appel n&apos;est jamais révélé avant de
            l&apos;avoir joué.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {scenarios.map((scenario) => (
            <Link
              key={scenario.id}
              href={`/appel/${scenario.id}`}
              className="flex items-center justify-between rounded-md border px-4 py-3 text-sm transition-colors hover:bg-accent"
            >
              <span>{scenario.libelleNeutre}</span>
              <Badge variant="secondary">Difficulté {scenario.difficulte}</Badge>
            </Link>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
