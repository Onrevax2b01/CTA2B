"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { EcranAppel } from "./EcranAppel";
import { EcranDebriefing } from "./EcranDebriefing";
import { EcranEngagement } from "./EcranEngagement";
import type { ResultatDebriefing } from "@/types/debriefing";
import type { Engagement, MessageDialogue } from "@/types/jeu";

// Les trois écrans (appel, engagement, débriefing) sont des phases d'un
// même parcours, jamais des pages distinctes : le dialogue clôturé doit
// rester disponible pour l'engagement puis le débriefing sans persistance
// ni navigation. Ce composant orchestre uniquement les transitions.
type Phase = "appel" | "engagement" | "chargement" | "debriefing";

interface SimulateurProps {
  scenarioId: string;
  libelleNeutre: string;
}

export function Simulateur({ scenarioId, libelleNeutre }: SimulateurProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("appel");
  const [dialogue, setDialogue] = useState<MessageDialogue[]>([]);
  const [nombreDeTours, setNombreDeTours] = useState(0);
  const [resultat, setResultat] = useState<ResultatDebriefing | null>(null);
  const [cle, setCle] = useState(0);

  function cloturerAppel(donnees: {
    dialogue: MessageDialogue[];
    nombreDeTours: number;
  }) {
    setDialogue(donnees.dialogue);
    setNombreDeTours(donnees.nombreDeTours);
    setPhase("engagement");
  }

  async function validerEngagement(engagement: Engagement) {
    setPhase("chargement");
    const reponse = await fetch(`/api/scenarios/${scenarioId}/debriefing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dialogue, engagement, nombreDeTours }),
    });
    const donnees = (await reponse.json()) as ResultatDebriefing;
    setResultat(donnees);
    setPhase("debriefing");
  }

  function rejouer() {
    setDialogue([]);
    setNombreDeTours(0);
    setResultat(null);
    setCle((c) => c + 1);
    setPhase("appel");
  }

  if (phase === "debriefing" && resultat) {
    return (
      <EcranDebriefing
        resultat={resultat}
        onRejouer={rejouer}
        onAppelSuivant={() => router.push("/appel/aleatoire")}
      />
    );
  }

  if (phase === "chargement") {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center px-4 py-10">
        <p className="text-sm text-muted-foreground">
          Calcul du débriefing...
        </p>
      </main>
    );
  }

  if (phase === "engagement") {
    return (
      <EcranEngagement dialogue={dialogue} onValider={validerEngagement} />
    );
  }

  return (
    <EcranAppel
      key={cle}
      scenarioId={scenarioId}
      libelleNeutre={libelleNeutre}
      onCloturer={cloturerAppel}
    />
  );
}
