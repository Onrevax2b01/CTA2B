import { NextResponse } from "next/server";

import { evolutionDeclenchee, repondreEnModeReplii } from "@/lib/moteurRepli";
import { chargerScenario } from "@/lib/scenarios";
import type { MessageDialogue } from "@/types/jeu";

interface CorpsRequete {
  scenarioId: string;
  saisieOperateur: string;
  historique: MessageDialogue[];
}

// Étape 1 : uniquement le moteur de repli déterministe. Le branchement à
// l'API Anthropic (utilisé si ANTHROPIC_API_KEY est définie) sera ajouté à
// l'étape 3, derrière la même forme de réponse JSON.
export async function POST(requete: Request) {
  const corps = (await requete.json()) as CorpsRequete;
  const scenario = chargerScenario(corps.scenarioId);

  if (!scenario) {
    return NextResponse.json(
      { erreur: "Scénario introuvable." },
      { status: 404 }
    );
  }

  if (!corps.saisieOperateur?.trim()) {
    return NextResponse.json(
      { erreur: "La saisie de l'opérateur est vide." },
      { status: 400 }
    );
  }

  const reponse = repondreEnModeReplii(
    scenario,
    corps.saisieOperateur,
    corps.historique ?? []
  );

  const toursOperateurDejaJoues = (corps.historique ?? []).filter(
    (m) => m.locuteur === "operateur"
  ).length;
  const evenement = evolutionDeclenchee(scenario, toursOperateurDejaJoues + 1);

  return NextResponse.json({ ...reponse, evenement });
}
