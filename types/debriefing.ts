import type { MessageDialogue, Engagement } from "./jeu";
import type { VeriteTerrain } from "./scenario";

export interface ScoreAxe {
  points: number;
  surMax: number;
}

export interface MalusApplique {
  motif: string;
  points: number;
}

export interface ScoreDetaille {
  total: number; // /100
  axes: {
    informationsVitales: ScoreAxe;
    bilanVictimes: ScoreAxe;
    conseilsDeSauvegarde: ScoreAxe;
    categorisation: ScoreAxe;
    adequationMoyens: ScoreAxe;
  };
  malus: MalusApplique[];
}

export type PertinenceQuestion = "pertinente" | "inutile" | "hors_sujet";

// Réplique du dialogue rejouée pour le débriefing, annotée pour les
// questions de l'opérateur (jamais pour les répliques du requérant).
export interface MessageAnnote extends MessageDialogue {
  pertinence?: PertinenceQuestion;
}

export interface InfoManquee {
  id: string;
  libelle: string;
}

export interface ComparatifCategorisation {
  familleChoisie: string;
  motifChoisi: string;
  motifCorrect: boolean;
  motifAcceptable: boolean;
  familleAttendue: string;
  motifAttendu: string;
}

export interface ComparatifMoyen {
  code: string;
  libelle: string;
  quantiteEnvoyee: number;
  attendu: boolean;
  acceptable: boolean;
  excessif: boolean;
}

export interface ResultatDebriefing {
  titreReel: string;
  natureReelle: string;
  score: ScoreDetaille;
  dialogueAnnote: MessageAnnote[];
  informationsJamaisObtenues: InfoManquee[];
  categorisation: ComparatifCategorisation;
  comparatifMoyens: ComparatifMoyen[];
  sousEngagement: boolean;
  surEngagement: boolean;
  conseilsDeSauvegardeAttendus: string[];
  conseilsDonnes: string[];
  verite: VeriteTerrain;
}

export interface CorpsRequeteDebriefing {
  dialogue: MessageDialogue[];
  engagement: Engagement;
  nombreDeTours: number;
}
