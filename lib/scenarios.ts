import fs from "node:fs";
import path from "node:path";

import type { Scenario, ScenarioResume } from "@/types/scenario";

// Accès aux scénarios stockés en fichiers JSON. Module strictement
// côté serveur (fs) : ne jamais importer depuis un composant client, la
// vérité terrain ne doit jamais transiter directement vers le navigateur.

const DOSSIER_SCENARIOS = path.join(process.cwd(), "data", "scenarios");

function chargerTousLesScenarios(): Scenario[] {
  const fichiers = fs
    .readdirSync(DOSSIER_SCENARIOS)
    .filter((fichier) => fichier.endsWith(".json"))
    .sort();

  return fichiers.map((fichier) => {
    const contenu = fs.readFileSync(
      path.join(DOSSIER_SCENARIOS, fichier),
      "utf-8"
    );
    return JSON.parse(contenu) as Scenario;
  });
}

// Libellés neutres affichés à l'accueil : jamais le vrai titre du scénario.
export function listerResumes(): ScenarioResume[] {
  return chargerTousLesScenarios().map((scenario, index) => ({
    id: scenario.id,
    difficulte: scenario.difficulte,
    libelleNeutre: `Appel n°${index + 1} — difficulté ${scenario.difficulte}`,
  }));
}

export function chargerScenario(id: string): Scenario | undefined {
  return chargerTousLesScenarios().find((scenario) => scenario.id === id);
}

export function scenarioAleatoire(): Scenario {
  const tous = chargerTousLesScenarios();
  return tous[Math.floor(Math.random() * tous.length)];
}
