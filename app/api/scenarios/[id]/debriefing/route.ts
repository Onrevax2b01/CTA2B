import { NextResponse } from "next/server";

import { calculerDebriefing } from "@/lib/scoring";
import { chargerScenario } from "@/lib/scenarios";
import type { CorpsRequeteDebriefing } from "@/types/debriefing";

// Calcule le débriefing (score + vérité terrain complète) côté serveur
// uniquement : le client ne doit jamais recevoir la vérité terrain avant
// la clôture de l'appel.
export async function POST(
  requete: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const scenario = chargerScenario(id);

  if (!scenario) {
    return NextResponse.json(
      { erreur: "Scénario introuvable." },
      { status: 404 }
    );
  }

  const corps = (await requete.json()) as CorpsRequeteDebriefing;

  if (!corps.engagement?.motifCategorie) {
    return NextResponse.json(
      { erreur: "Catégorisation manquante." },
      { status: 400 }
    );
  }

  const resultat = calculerDebriefing(
    scenario,
    corps.dialogue ?? [],
    corps.engagement,
    corps.nombreDeTours ?? 0
  );

  return NextResponse.json(resultat);
}
