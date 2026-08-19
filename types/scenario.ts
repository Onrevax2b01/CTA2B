// Modèle de données d'un scénario d'appel CTA-CODIS.
// Un scénario = une "vérité terrain" que le requérant simulé ne livre
// que par bribes, en fonction de ce que l'opérateur lui demande.

export type EtatEmotionnel =
  | "calme"
  | "inquiet"
  | "paniqué"
  | "agressif"
  | "confus";

export type Fiabilite = "bonne" | "moyenne" | "mauvaise";

export interface Requerant {
  profil: string;
  etatEmotionnel: EtatEmotionnel;
  fiabilite: Fiabilite;
  contraintes: string[];
}

export interface Victime {
  age: string;
  sexe: string;
  conscience: string;
  respiration: string;
  hemorragie: string;
  plaintes: string;
  contexte: string;
}

export interface Evolution {
  apresNTours: number;
  evenement: string;
}

// La vérité terrain complète. Le requérant n'en connaît qu'une partie,
// et ne la révèle que si l'opérateur pose la bonne question.
export interface VeriteTerrain {
  adresse: string;
  commune: string;
  precisionsAcces: string;
  numeroRappel: string;
  natureReelle: string;
  nbVictimes: number;
  victimes: Victime[];
  risques: string[];
  environnement: string;
  evolutions: Evolution[];
}

export interface QuestionCle {
  id: string;
  libelle: string;
  poids: number;
}

export interface Attendu {
  questionsCles: QuestionCle[];
  conseilsDeSauvegarde: string[];
  moyensAttendus: string[];
  moyensAcceptables: string[];
  moyensExcessifs: string[];
  delaiCibleTours: number;
}

export interface Scenario {
  id: string;
  titre: string;
  difficulte: 1 | 2 | 3;
  categorieAttendue: string;
  categoriesAcceptables: string[];
  requerant: Requerant;
  verite: VeriteTerrain;
  infosSpontanees: string[];
  pieges: string[];
  attendu: Attendu;
  // Mode dégradé : réponses pré-écrites indexées sur les ids de questionsCles,
  // utilisées par le moteur de repli en l'absence de clé API.
  reponsesPreecrites: Record<string, string>;
}

// Résumé neutre affiché à l'accueil, avant que le scénario ne soit joué
// (on ne montre jamais le titre réel ni la nature avant le débriefing).
export interface ScenarioResume {
  id: string;
  difficulte: 1 | 2 | 3;
  libelleNeutre: string;
}
