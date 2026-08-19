// Nomenclature de catégorisation à deux niveaux (famille → motif).
// Sert à la fois pour l'écran d'engagement (choix de l'opérateur) et pour
// le scoring (distinction erreur de famille / erreur de motif).

export interface Motif {
  code: string;
  libelle: string;
}

export interface Famille {
  code: string;
  libelle: string;
  motifs: Motif[];
}

export const NOMENCLATURE: Famille[] = [
  {
    code: "SUAP",
    libelle: "Secours d'urgence aux personnes",
    motifs: [
      { code: "SUAP_ARRET_CARDIAQUE", libelle: "Arrêt cardiaque" },
      { code: "SUAP_DETRESSE_RESP", libelle: "Détresse respiratoire" },
      { code: "SUAP_MALAISE_DOMICILE", libelle: "Malaise à domicile" },
      { code: "SUAP_MALAISE_VOIE_PUB", libelle: "Malaise sur voie publique" },
      { code: "SUAP_CHUTE_PLAIN_PIED", libelle: "Chute de plain-pied" },
      { code: "SUAP_CHUTE_HAUTEUR", libelle: "Chute de hauteur" },
      { code: "SUAP_HEMORRAGIE", libelle: "Hémorragie" },
      { code: "SUAP_TRAUMATISME", libelle: "Traumatisme" },
      { code: "SUAP_INTOXICATION", libelle: "Intoxication" },
      { code: "SUAP_BRULURE", libelle: "Brûlure" },
      { code: "SUAP_ACCOUCHEMENT", libelle: "Accouchement inopiné" },
      {
        code: "SUAP_PERSONNE_A_TERRE",
        libelle: "Personne à terre, situation indéterminée",
      },
      { code: "SUAP_RELEVAGE", libelle: "Relevage sans gravité" },
    ],
  },
  {
    code: "AVP",
    libelle: "Accident de circulation",
    motifs: [
      { code: "AVP_SANS_VICTIME", libelle: "AVP sans victime" },
      { code: "AVP_AVEC_VICTIMES", libelle: "AVP avec victime(s)" },
      {
        code: "AVP_VICTIME_INCARCEREE",
        libelle: "AVP avec victime incarcérée",
      },
      {
        code: "AVP_POIDS_LOURD_TMD",
        libelle: "AVP impliquant un poids lourd ou un TMD",
      },
      { code: "AVP_PIETON_DEUX_ROUES", libelle: "AVP piéton ou deux-roues" },
    ],
  },
  {
    code: "INC",
    libelle: "Incendie",
    motifs: [
      { code: "INC_HABITATION", libelle: "Feu d'habitation" },
      {
        code: "INC_APPARTEMENT_ETAGE",
        libelle: "Feu d'appartement en étage",
      },
      { code: "INC_ERP", libelle: "Feu d'ERP" },
      {
        code: "INC_LOCAL_COMMERCIAL_INDUS",
        libelle: "Feu de local commercial ou industriel",
      },
      { code: "INC_VEHICULE", libelle: "Feu de véhicule" },
      {
        code: "INC_POUBELLE_CONTENEUR",
        libelle: "Feu de poubelle ou de conteneur",
      },
      {
        code: "INC_VEGETATION",
        libelle: "Feu de végétation ou de broussailles",
      },
      { code: "INC_CHEMINEE", libelle: "Feu de cheminée" },
      { code: "INC_ODEUR_FUMEE_SUSPECTE", libelle: "Odeur ou fumée suspecte" },
    ],
  },
  {
    code: "OD",
    libelle: "Opérations diverses",
    motifs: [
      { code: "OD_FUITE_EAU", libelle: "Fuite d'eau" },
      { code: "OD_OUVERTURE_PORTE", libelle: "Ouverture de porte" },
      { code: "OD_NID_HYMENOPTERES", libelle: "Nid d'hyménoptères" },
      { code: "OD_ANIMAL_DIFFICULTE", libelle: "Animal en difficulté" },
      { code: "OD_ASCENSEUR_BLOQUE", libelle: "Ascenseur bloqué" },
      {
        code: "OD_DEGAGEMENT_VOIE_PUB",
        libelle: "Dégagement de voie publique",
      },
      {
        code: "OD_BACHAGE_INTEMPERIE",
        libelle: "Bâchage ou mise en sécurité après intempérie",
      },
    ],
  },
  {
    code: "RT",
    libelle: "Risques technologiques",
    motifs: [
      { code: "RT_FUITE_GAZ", libelle: "Fuite de gaz" },
      { code: "RT_ODEUR_GAZ", libelle: "Odeur de gaz" },
      {
        code: "RT_FUITE_PRODUIT_CHIMIQUE",
        libelle: "Fuite de produit chimique",
      },
      { code: "RT_POLLUTION", libelle: "Pollution" },
      {
        code: "RT_SUSPICION_CO",
        libelle: "Suspicion de monoxyde de carbone",
      },
    ],
  },
  {
    code: "DIV",
    libelle: "Appel non urgent, réorientation ou canular",
    motifs: [
      { code: "DIV_NON_URGENT", libelle: "Appel non urgent" },
      { code: "DIV_REORIENTATION", libelle: "Réorientation" },
      { code: "DIV_CANULAR", libelle: "Canular" },
    ],
  },
];

export function trouverFamille(codeFamille: string): Famille | undefined {
  return NOMENCLATURE.find((f) => f.code === codeFamille);
}

export function trouverMotif(
  codeFamille: string,
  codeMotif: string
): Motif | undefined {
  return trouverFamille(codeFamille)?.motifs.find((m) => m.code === codeMotif);
}

// Retrouve la famille d'un motif donné, sans connaître sa famille à l'avance
// (utile pour le scoring : comparer la famille du motif choisi à l'attendu).
export function familleDuMotif(codeMotif: string): Famille | undefined {
  return NOMENCLATURE.find((f) =>
    f.motifs.some((m) => m.code === codeMotif)
  );
}
