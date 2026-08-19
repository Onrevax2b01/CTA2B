import type { Scenario } from "@/types/scenario";
import type { MessageDialogue, ReponseRequerant } from "@/types/jeu";

// Normalise une chaîne pour la comparaison : minuscules, sans accents,
// ponctuation neutralisée.
function normaliser(texte: string): string {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ");
}

interface Concept {
  cle: string;
  motsCles: string[];
}

// Concepts génériques servant à apparier la question tapée par l'opérateur
// à une questionCle du scénario (par égalité ou inclusion sur l'id).
// L'ordre compte : les motifs les plus spécifiques sont testés en premier
// pour éviter qu'une question sur le "numéro de rappel" soit confondue
// avec une question sur l'"adresse".
const CONCEPTS: Concept[] = [
  {
    cle: "numero_rappel",
    motsCles: ["numero", "rappel", "telephone", "joindre"],
  },
  {
    cle: "adresse",
    motsCles: ["adresse", "rue", "situe", "localisation", "ou etes vous", "vous etes ou"],
  },
  { cle: "commune", motsCles: ["commune", "ville", "quelle ville"] },
  {
    cle: "acces",
    motsCles: ["etage", "code", "digicode", "portail", "acces", "entree"],
  },
  {
    cle: "conscience",
    motsCles: ["conscient", "reveille", "repond", "yeux", "parle t il"],
  },
  { cle: "respiration", motsCles: ["respire", "respiration", "souffle"] },
  { cle: "hemorragie", motsCles: ["saigne", "sang", "hemorragie"] },
  {
    cle: "nb_victimes",
    motsCles: ["combien", "victimes", "blesse", "personnes touchees"],
  },
  {
    cle: "risques",
    motsCles: ["danger", "risque", "gaz", "electri", "propagation", "fumee"],
  },
  {
    cle: "nature",
    motsCles: ["que se passe", "qu est ce qui se passe", "decrivez", "expliquez", "qu y a t il"],
  },
  { cle: "environnement", motsCles: ["meteo", "circulation", "dehors"] },
];

function detecterConcept(saisie: string): string | null {
  const texte = normaliser(saisie);
  for (const concept of CONCEPTS) {
    if (concept.motsCles.some((mot) => texte.includes(normaliser(mot)))) {
      return concept.cle;
    }
  }
  return null;
}

function questionCleCorrespondante(scenario: Scenario, concept: string) {
  return scenario.attendu.questionsCles.find(
    (q) => q.id === concept || q.id.includes(concept) || concept.includes(q.id)
  );
}

const REPONSES_INCOMPRISES = [
  "Pardon, je ne comprends pas bien ce que vous me demandez.",
  "Euh... vous pouvez répéter autrement ?",
  "Je ne sais pas trop quoi vous dire.",
];

function tirerAuSort(liste: string[]): string {
  return liste[Math.floor(Math.random() * liste.length)];
}

// Réplique d'ouverture du requérant, générée à partir des infosSpontanees
// du scénario. Aucune info n'est marquée "révélée" ici : à charge de
// l'opérateur de les reporter lui-même sur la fiche, comme il le ferait
// pour un appel réel où il doit rester attentif dès le décrochage.
export function genererOuvertureRequerant(scenario: Scenario): ReponseRequerant {
  const ouverture =
    scenario.infosSpontanees.length > 0
      ? scenario.infosSpontanees.join(" ")
      : "Allô ? Il faut m'aider !";
  return {
    reponse: ouverture,
    infosReveleesIds: [],
    etatEmotionnel: scenario.requerant.etatEmotionnel,
    raccrocheOuPerdReseau: false,
  };
}

// Moteur de repli déterministe : utilisé quand ANTHROPIC_API_KEY est absente,
// ou en secours si le moteur LLM échoue. Apparie la saisie de l'opérateur aux
// questionsCles du scénario par mots-clés/synonymes, et restitue la réponse
// pré-écrite correspondante. Moins riche que le moteur LLM, mais entièrement
// jouable et testable hors ligne.
export function repondreEnModeReplii(
  scenario: Scenario,
  saisieOperateur: string,
  historique: MessageDialogue[]
): ReponseRequerant {
  const dejaReveleesIds = new Set(
    historique.flatMap((m) => m.infosReveleesIds ?? [])
  );

  const concept = detecterConcept(saisieOperateur);
  const questionCle = concept
    ? questionCleCorrespondante(scenario, concept)
    : undefined;
  const reponsePreecrite = questionCle
    ? scenario.reponsesPreecrites[questionCle.id]
    : undefined;

  if (questionCle && reponsePreecrite) {
    const dejaRevelee = dejaReveleesIds.has(questionCle.id);
    return {
      reponse: dejaRevelee
        ? `Je vous l'ai déjà dit : ${reponsePreecrite}`
        : reponsePreecrite,
      infosReveleesIds: dejaRevelee ? [] : [questionCle.id],
      etatEmotionnel: scenario.requerant.etatEmotionnel,
      raccrocheOuPerdReseau: false,
    };
  }

  return {
    reponse: tirerAuSort(REPONSES_INCOMPRISES),
    infosReveleesIds: [],
    etatEmotionnel: scenario.requerant.etatEmotionnel,
    raccrocheOuPerdReseau: false,
  };
}
