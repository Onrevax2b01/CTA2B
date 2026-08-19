import { NextResponse } from "next/server";

import { genererOuvertureRequerant } from "@/lib/moteurRepli";
import { chargerScenario } from "@/lib/scenarios";

// Réplique d'ouverture du requérant. Ne renvoie jamais le scénario complet
// (la vérité terrain reste côté serveur jusqu'au débriefing).
export async function GET(
  _requete: Request,
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

  return NextResponse.json(genererOuvertureRequerant(scenario));
}
