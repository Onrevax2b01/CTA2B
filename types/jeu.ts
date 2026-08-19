import type { EtatEmotionnel } from "./scenario";

export type Locuteur = "requerant" | "operateur";

export interface MessageDialogue {
  id: string;
  locuteur: Locuteur;
  texte: string;
  horodatage: number; // ms écoulées depuis le décrochage
  // Renseigné uniquement pour les répliques du requérant : les ids de
  // questionsCles révélées par cette réplique. Sert de base au scoring.
  infosReveleesIds?: string[];
}

// Sortie attendue du moteur conversationnel (API ou repli), avant
// horodatage/insertion dans le fil de dialogue.
export interface ReponseRequerant {
  reponse: string;
  infosReveleesIds: string[];
  etatEmotionnel: EtatEmotionnel;
  raccrocheOuPerdReseau: boolean;
}

// Fiche d'alerte : remplie manuellement par l'opérateur, jamais pré-remplie.
export interface FicheAlerte {
  adresse: string;
  commune: string;
  precisionsAcces: string;
  numeroRappel: string;
  nature: string;
  nbVictimes: string;
  risques: string;
}

export const ficheAlerteVide: FicheAlerte = {
  adresse: "",
  commune: "",
  precisionsAcces: "",
  numeroRappel: "",
  nature: "",
  nbVictimes: "",
  risques: "",
};

export interface Engagement {
  familleCategorie: string;
  motifCategorie: string;
  moyens: { code: string; quantite: number }[];
}
