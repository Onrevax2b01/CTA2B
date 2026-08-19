// Catalogue des engins et ressources mobilisables.
// `attendu.moyensAttendus` (côté scénario) référence ces codes : le
// catalogue reste indépendant de toute grille de départ codée en dur.

export type FamilleEngin =
  | "secours-personnes"
  | "incendie"
  | "sauvetage-specialise"
  | "commandement"
  | "concours-exterieur";

export interface Engin {
  code: string;
  libelle: string;
  famille: FamilleEngin;
  description: string;
}

export const ENGINS: Engin[] = [
  {
    code: "VSAV",
    libelle: "Véhicule de secours et d'assistance aux victimes",
    famille: "secours-personnes",
    description: "Engin de premier secours aux personnes, équipage SUAP.",
  },
  {
    code: "VLI",
    libelle: "Véhicule de liaison infirmier — infirmier sapeur-pompier",
    famille: "secours-personnes",
    description: "Renfort paramédical (ISP) sur bilan grave.",
  },
  {
    code: "SMUR",
    libelle: "Structure mobile d'urgence et de réanimation",
    famille: "secours-personnes",
    description: "Renfort médicalisé SAMU, engagé sur détresse vitale.",
  },
  {
    code: "FPT",
    libelle: "Fourgon pompe-tonne",
    famille: "incendie",
    description: "Engin-pompe principal de lutte contre l'incendie.",
  },
  {
    code: "FPTL",
    libelle: "Fourgon pompe-tonne léger",
    famille: "incendie",
    description: "Version allégée du FPT, accès difficiles.",
  },
  {
    code: "VPI",
    libelle: "Véhicule de première intervention",
    famille: "incendie",
    description: "Première action rapide sur feu naissant.",
  },
  {
    code: "CCF",
    libelle: "Camion-citerne feux de forêts",
    famille: "incendie",
    description: "Lutte contre les feux de végétation.",
  },
  {
    code: "CCGC",
    libelle: "Camion-citerne grande capacité",
    famille: "incendie",
    description: "Grande réserve d'eau, feux nécessitant un gros tonnage.",
  },
  {
    code: "EPA",
    libelle: "Échelle pivotante automatique",
    famille: "incendie",
    description: "Sauvetage et attaque en hauteur.",
  },
  {
    code: "VSR",
    libelle: "Véhicule de secours routier",
    famille: "sauvetage-specialise",
    description: "Désincarcération et secours sur accident de circulation.",
  },
  {
    code: "VTU",
    libelle: "Véhicule tout usage",
    famille: "sauvetage-specialise",
    description: "Opérations diverses (bâchage, animal, ouverture de porte).",
  },
  {
    code: "VLCG",
    libelle: "Véhicule de liaison chef de groupe",
    famille: "commandement",
    description: "Encadrement d'un groupe d'intervention.",
  },
  {
    code: "VLCC",
    libelle: "Véhicule de liaison chef de colonne",
    famille: "commandement",
    description: "Encadrement d'une colonne, sinistre important.",
  },
  {
    code: "GRIMP",
    libelle: "Groupe de reconnaissance et d'intervention en milieu périlleux",
    famille: "sauvetage-specialise",
    description: "Sauvetage en milieu périlleux (hauteur, excavation).",
  },
  {
    code: "SAL",
    libelle: "Équipe de plongeurs",
    famille: "sauvetage-specialise",
    description: "Sauvetage aquatique et lacustre.",
  },
  {
    code: "VAR",
    libelle: "Véhicule d'assistance respiratoire",
    famille: "secours-personnes",
    description: "Soutien respiratoire lors d'intoxications ou de feux.",
  },
  {
    code: "CMIC",
    libelle: "Cellule mobile d'intervention chimique",
    famille: "sauvetage-specialise",
    description: "Risque chimique avéré.",
  },
  {
    code: "CMIR",
    libelle: "Cellule mobile d'intervention radiologique",
    famille: "sauvetage-specialise",
    description: "Risque radiologique avéré.",
  },
  {
    code: "FORCES_ORDRE",
    libelle: "Renfort forces de l'ordre",
    famille: "concours-exterieur",
    description: "Police ou gendarmerie, sécurisation ou ordre public.",
  },
  {
    code: "REGULATION_SAMU",
    libelle: "Régulation médicale SAMU",
    famille: "concours-exterieur",
    description: "Avis médical ou co-régulation, sans envoi d'engin dédié.",
  },
];

// Certains moyens peuvent partir en nombre (ex : plusieurs FPT sur un feu
// d'ERP). Les autres sont sélectionnables une seule fois.
export const ENGINS_QUANTIFIABLES = new Set([
  "FPT",
  "FPTL",
  "VPI",
  "CCF",
  "CCGC",
  "VSAV",
  "FORCES_ORDRE",
]);

export function trouverEngin(code: string): Engin | undefined {
  return ENGINS.find((e) => e.code === code);
}
