import { normaliser } from "./moteurRepli";
import { trouverEngin } from "./engins";
import { familleDuMotif } from "./nomenclature";
import type { Engagement, MessageDialogue } from "@/types/jeu";
import type { Scenario } from "@/types/scenario";
import type {
  ComparatifCategorisation,
  ComparatifMoyen,
  InfoManquee,
  MalusApplique,
  MessageAnnote,
  ResultatDebriefing,
  ScoreDetaille,
} from "@/types/debriefing";

// Pondérations des cinq axes (§8 du cahier des charges). Somme = 100.
// Constantes volontairement isolées ici pour rester facilement ajustables,
// indépendamment de la logique de calcul.
export const POIDS_AXES = {
  informationsVitales: 30,
  bilanVictimes: 20,
  conseilsDeSauvegarde: 15,
  categorisation: 15,
  adequationMoyens: 20,
} as const;

// Identifiants de questionsCles considérés comme relevant du recueil des
// informations vitales (axe 1) par convention de nommage. Tout id qui ne
// figure ni ici ni dans BILAN_VICTIME_IDS est rattaché à l'axe 1 par
// défaut (adresse, accès, numéro, nature, victimes, risques, environnement
// couvrent l'essentiel des cas listés au §8).
const BILAN_VICTIME_IDS = [
  "conscience",
  "respiration",
  "hemorragie",
  "age",
  "circonstances",
  "plaintes",
];

const IDS_ELIMINATOIRES = ["adresse", "numero_rappel"];
const PLAFOND_SANS_ADRESSE_OU_RAPPEL = 10;

const POINTS_CATEGORISATION = {
  motifExact: POIDS_AXES.categorisation,
  motifAcceptable: 12,
  memeFamilleAutreMotif: 6,
  mauvaiseFamille: 0,
} as const;

// Un moyen excessif coûte la moitié du poids moyen d'un moyen attendu
// ("sur-engagement pénalisé de moitié" du sous-engagement).
const RATIO_PENALITE_MOYEN_EXCESSIF = 0.5;

const MALUS_PAR_TOUR_AU_DELA_DU_DELAI = 2;
const MALUS_MAX_DEPASSEMENT_DELAI = 10;
const SEUIL_QUESTIONS_HORS_SUJET = 3;
const MALUS_PAR_QUESTION_HORS_SUJET_AU_DELA_DU_SEUIL = 2;
const MALUS_MAX_HORS_SUJET = 10;
const MALUS_CLOTURE_SANS_ELEMENT_VITAL = 5;

function clamp(valeur: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, valeur));
}

function unionInfosRevelees(dialogue: MessageDialogue[]): Set<string> {
  return new Set(dialogue.flatMap((m) => m.infosReveleesIds ?? []));
}

function estBilanVictime(id: string): boolean {
  return BILAN_VICTIME_IDS.some((b) => id === b || id.includes(b));
}

function scoreInformationsVitales(scenario: Scenario, revelees: Set<string>) {
  const questions = scenario.attendu.questionsCles.filter(
    (q) => !estBilanVictime(q.id)
  );
  const poidsTotal = questions.reduce((s, q) => s + q.poids, 0) || 1;
  const poidsObtenu = questions
    .filter((q) => revelees.has(q.id))
    .reduce((s, q) => s + q.poids, 0);

  let points = Math.round(
    (poidsObtenu / poidsTotal) * POIDS_AXES.informationsVitales
  );

  const manqueEliminatoire = IDS_ELIMINATOIRES.some((id) => !revelees.has(id));
  if (manqueEliminatoire) {
    points = Math.min(points, PLAFOND_SANS_ADRESSE_OU_RAPPEL);
  }

  return { points: clamp(points, 0, POIDS_AXES.informationsVitales), surMax: POIDS_AXES.informationsVitales };
}

function scoreBilanVictimes(scenario: Scenario, revelees: Set<string>) {
  const surMax = POIDS_AXES.bilanVictimes;
  if (scenario.verite.nbVictimes === 0) {
    // Rien à évaluer : pas de victime à bilanter.
    return { points: surMax, surMax };
  }

  const questions = scenario.attendu.questionsCles.filter((q) =>
    estBilanVictime(q.id)
  );
  if (questions.length === 0) {
    return { points: surMax, surMax };
  }

  const poidsTotal = questions.reduce((s, q) => s + q.poids, 0) || 1;
  const poidsObtenu = questions
    .filter((q) => revelees.has(q.id))
    .reduce((s, q) => s + q.poids, 0);

  const points = Math.round((poidsObtenu / poidsTotal) * surMax);
  return { points: clamp(points, 0, surMax), surMax };
}

function detecterConseilsDonnes(
  scenario: Scenario,
  dialogue: MessageDialogue[]
): string[] {
  const messagesOperateur = dialogue
    .filter((m) => m.locuteur === "operateur")
    .map((m) => normaliser(m.texte));

  return scenario.attendu.conseilsDeSauvegarde.filter((conseil) => {
    const motsSignificatifs = normaliser(conseil)
      .split(" ")
      .filter((mot) => mot.length > 3);
    if (motsSignificatifs.length === 0) return false;

    const seuil = Math.max(1, Math.ceil(motsSignificatifs.length * 0.4));
    return messagesOperateur.some((texte) => {
      const correspondances = motsSignificatifs.filter((mot) =>
        texte.includes(mot)
      ).length;
      return correspondances >= seuil;
    });
  });
}

function scoreConseils(scenario: Scenario, conseilsDonnes: string[]) {
  const surMax = POIDS_AXES.conseilsDeSauvegarde;
  const total = scenario.attendu.conseilsDeSauvegarde.length;
  if (total === 0) return { points: surMax, surMax };

  const points = Math.round((conseilsDonnes.length / total) * surMax);
  return { points: clamp(points, 0, surMax), surMax };
}

function evaluerCategorisation(
  scenario: Scenario,
  engagement: Engagement
): { score: { points: number; surMax: number }; comparatif: ComparatifCategorisation } {
  const surMax = POIDS_AXES.categorisation;
  const motifChoisi = engagement.motifCategorie;
  const motifAttendu = scenario.categorieAttendue;

  const motifCorrect = motifChoisi === motifAttendu;
  const motifAcceptable = scenario.categoriesAcceptables.includes(motifChoisi);
  const memeFamille =
    familleDuMotif(motifChoisi)?.code === familleDuMotif(motifAttendu)?.code;

  let points: number;
  if (motifCorrect) points = POINTS_CATEGORISATION.motifExact;
  else if (motifAcceptable) points = POINTS_CATEGORISATION.motifAcceptable;
  else if (memeFamille) points = POINTS_CATEGORISATION.memeFamilleAutreMotif;
  else points = POINTS_CATEGORISATION.mauvaiseFamille;

  return {
    score: { points: clamp(points, 0, surMax), surMax },
    comparatif: {
      familleChoisie: engagement.familleCategorie,
      motifChoisi,
      motifCorrect,
      motifAcceptable,
      familleAttendue: familleDuMotif(motifAttendu)?.code ?? "",
      motifAttendu,
    },
  };
}

function evaluerMoyens(
  scenario: Scenario,
  engagement: Engagement
): {
  score: { points: number; surMax: number };
  comparatif: ComparatifMoyen[];
  sousEngagement: boolean;
  surEngagement: boolean;
} {
  const surMax = POIDS_AXES.adequationMoyens;
  const { moyensAttendus, moyensAcceptables, moyensExcessifs } = scenario.attendu;
  const codesEnvoyes = new Set(engagement.moyens.map((m) => m.code));

  const attendusPresents = moyensAttendus.filter((c) => codesEnvoyes.has(c));
  const ratioAttendus = attendusPresents.length / Math.max(1, moyensAttendus.length);
  const excessifsEnvoyes = [...codesEnvoyes].filter((c) =>
    moyensExcessifs.includes(c)
  );

  const poidsMoyenAttendu = surMax / Math.max(1, moyensAttendus.length);
  const malusExcessif =
    excessifsEnvoyes.length * poidsMoyenAttendu * RATIO_PENALITE_MOYEN_EXCESSIF;

  const points = clamp(
    Math.round(ratioAttendus * surMax - malusExcessif),
    0,
    surMax
  );

  const tousLesCodesConcernes = new Set([
    ...moyensAttendus,
    ...moyensAcceptables,
    ...moyensExcessifs,
    ...codesEnvoyes,
  ]);

  const comparatif: ComparatifMoyen[] = [...tousLesCodesConcernes].map((code) => ({
    code,
    libelle: trouverEngin(code)?.libelle ?? code,
    quantiteEnvoyee:
      engagement.moyens.find((m) => m.code === code)?.quantite ?? 0,
    attendu: moyensAttendus.includes(code),
    acceptable: moyensAcceptables.includes(code),
    excessif: moyensExcessifs.includes(code),
  }));

  return {
    score: { points, surMax },
    comparatif,
    sousEngagement: ratioAttendus < 1,
    surEngagement: excessifsEnvoyes.length > 0,
  };
}

// Classe chaque question de l'opérateur : "pertinente" si elle révèle une
// information encore inconnue, "inutile" si l'information était déjà
// obtenue, "hors_sujet" sinon. Se base uniquement sur infosReveleesIds
// (jamais une analyse du texte), conformément au moteur conversationnel.
function annoterDialogue(dialogue: MessageDialogue[]): MessageAnnote[] {
  const dejaRevelees = new Set<string>();
  const annote: MessageAnnote[] = [];

  for (let i = 0; i < dialogue.length; i++) {
    const message = dialogue[i];
    if (message.locuteur !== "operateur") {
      annote.push(message);
      continue;
    }

    const reponseSuivante = dialogue[i + 1];
    const idsRevelees = reponseSuivante?.infosReveleesIds ?? [];
    const nouvellesInfos = idsRevelees.filter((id) => !dejaRevelees.has(id));

    let pertinence: MessageAnnote["pertinence"];
    if (nouvellesInfos.length > 0) pertinence = "pertinente";
    else if (idsRevelees.length > 0) pertinence = "inutile";
    else pertinence = "hors_sujet";

    idsRevelees.forEach((id) => dejaRevelees.add(id));
    annote.push({ ...message, pertinence });
  }

  return annote;
}

export function calculerDebriefing(
  scenario: Scenario,
  dialogue: MessageDialogue[],
  engagement: Engagement,
  nombreDeTours: number
): ResultatDebriefing {
  const revelees = unionInfosRevelees(dialogue);

  const axeInfosVitales = scoreInformationsVitales(scenario, revelees);
  const axeBilanVictimes = scoreBilanVictimes(scenario, revelees);
  const conseilsDonnes = detecterConseilsDonnes(scenario, dialogue);
  const axeConseils = scoreConseils(scenario, conseilsDonnes);
  const { score: axeCategorisation, comparatif: comparatifCategorisation } =
    evaluerCategorisation(scenario, engagement);
  const {
    score: axeMoyens,
    comparatif: comparatifMoyens,
    sousEngagement,
    surEngagement,
  } = evaluerMoyens(scenario, engagement);

  const malus: MalusApplique[] = [];

  if (nombreDeTours > scenario.attendu.delaiCibleTours) {
    const points = Math.min(
      MALUS_MAX_DEPASSEMENT_DELAI,
      (nombreDeTours - scenario.attendu.delaiCibleTours) *
        MALUS_PAR_TOUR_AU_DELA_DU_DELAI
    );
    malus.push({
      motif: `Délai dépassé (${nombreDeTours} tours pour un objectif de ${scenario.attendu.delaiCibleTours})`,
      points,
    });
  }

  const dialogueAnnote = annoterDialogue(dialogue);
  const nbHorsSujet = dialogueAnnote.filter(
    (m) => m.pertinence === "hors_sujet"
  ).length;
  if (nbHorsSujet > SEUIL_QUESTIONS_HORS_SUJET) {
    malus.push({
      motif: `${nbHorsSujet} questions hors sujet ou sans réponse exploitable`,
      points: Math.min(
        MALUS_MAX_HORS_SUJET,
        (nbHorsSujet - SEUIL_QUESTIONS_HORS_SUJET) *
          MALUS_PAR_QUESTION_HORS_SUJET_AU_DELA_DU_SEUIL
      ),
    });
  }

  if (IDS_ELIMINATOIRES.some((id) => !revelees.has(id))) {
    malus.push({
      motif: "Appel clôturé sans adresse et/ou numéro de rappel confirmés",
      points: MALUS_CLOTURE_SANS_ELEMENT_VITAL,
    });
  }

  const totalAxes =
    axeInfosVitales.points +
    axeBilanVictimes.points +
    axeConseils.points +
    axeCategorisation.points +
    axeMoyens.points;
  const totalMalus = malus.reduce((s, m) => s + m.points, 0);
  const total = clamp(Math.round(totalAxes - totalMalus), 0, 100);

  const score: ScoreDetaille = {
    total,
    axes: {
      informationsVitales: axeInfosVitales,
      bilanVictimes: axeBilanVictimes,
      conseilsDeSauvegarde: axeConseils,
      categorisation: axeCategorisation,
      adequationMoyens: axeMoyens,
    },
    malus,
  };

  const informationsJamaisObtenues: InfoManquee[] = scenario.attendu.questionsCles
    .filter((q) => !revelees.has(q.id))
    .map((q) => ({ id: q.id, libelle: q.libelle }));

  return {
    titreReel: scenario.titre,
    natureReelle: scenario.verite.natureReelle,
    score,
    dialogueAnnote,
    informationsJamaisObtenues,
    categorisation: comparatifCategorisation,
    comparatifMoyens,
    sousEngagement,
    surEngagement,
    conseilsDeSauvegardeAttendus: scenario.attendu.conseilsDeSauvegarde,
    conseilsDonnes,
    verite: scenario.verite,
  };
}
