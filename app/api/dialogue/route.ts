import { NextResponse } from "next/server";

import { genererReponseLLM } from "@/lib/moteurLLM";
import { evolutionDeclenchee, repondreEnModeReplii } from "@/lib/moteurRepli";
import { chargerScenario } from "@/lib/scenarios";
import type { MessageDialogue } from "@/types/jeu";

interface CorpsRequete {
  scenarioId: string;
  saisieOperateur: string;
  historique: MessageDialogue[];
}

// Moteur conversationnel : l'API Anthropic si ANTHROPIC_API_KEY est
// définie (une tentative, puis une retentative en cas d'échec — refus,
// réseau, sortie invalide), sinon directement le moteur de repli. Le
// moteur de repli sert aussi de filet de sécurité final : le jeu ne doit
// jamais planter faute de clé ou de réponse exploitable du modèle.
async function obtenirReponse(
  scenario: NonNullable<ReturnType<typeof chargerScenario>>,
  saisieOperateur: string,
  historique: MessageDialogue[]
) {
  if (process.env.ANTHROPIC_API_KEY) {
    const reponseLLM =
      (await genererReponseLLM(scenario, saisieOperateur, historique)) ??
      (await genererReponseLLM(scenario, saisieOperateur, historique));
    if (reponseLLM) return reponseLLM;
  }

  return repondreEnModeReplii(scenario, saisieOperateur, historique);
}

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

  const historique = corps.historique ?? [];
  const reponse = await obtenirReponse(
    scenario,
    corps.saisieOperateur,
    historique
  );

  const toursOperateurDejaJoues = historique.filter(
    (m) => m.locuteur === "operateur"
  ).length;
  const evenement = evolutionDeclenchee(scenario, toursOperateurDejaJoues + 1);

  return NextResponse.json({ ...reponse, evenement });
}
