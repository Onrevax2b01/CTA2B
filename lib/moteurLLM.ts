import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

import { construirePromptSysteme } from "./promptRequerant";
import type { Scenario } from "@/types/scenario";
import type { MessageDialogue, ReponseRequerant } from "@/types/jeu";

const client = new Anthropic();

const SchemaReponseRequerant = z.object({
  reponse: z.string(),
  infosReveleesIds: z.array(z.string()),
  etatEmotionnel: z.enum(["calme", "inquiet", "paniqué", "agressif", "confus"]),
  raccrocheOuPerdReseau: z.boolean(),
});

// Traduit l'historique de dialogue en messages Anthropic. Le tout premier
// message est toujours la réplique d'ouverture, générée par le moteur de
// repli (jamais par le LLM, voir /api/scenarios/[id]/ouverture) : on
// l'écarte ici — l'API exige un premier message "user" — et elle est
// rappelée dans le prompt système pour ne pas être oubliée du modèle.
function historiqueEnMessages(
  historique: MessageDialogue[]
): Anthropic.MessageParam[] {
  const reste =
    historique.length > 0 && historique[0].locuteur === "requerant"
      ? historique.slice(1)
      : historique;

  return reste.map((message) => ({
    role: message.locuteur === "operateur" ? "user" : "assistant",
    content: message.texte,
  }));
}

// Moteur conversationnel principal : appelle l'API Anthropic pour incarner
// le requérant. Renvoie `null` en cas d'échec (refus, réseau, sortie
// invalide) — à charge de l'appelant de retenter puis de basculer sur le
// moteur de repli déterministe (voir /api/dialogue).
export async function genererReponseLLM(
  scenario: Scenario,
  saisieOperateur: string,
  historique: MessageDialogue[]
): Promise<ReponseRequerant | null> {
  try {
    const reponse = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 2048,
      // Effort réduit : chaque tour ne demande qu'une courte réplique de
      // civil respectant des contraintes simples, pas un raisonnement
      // ouvert — on privilégie la réactivité de l'échange.
      output_config: {
        format: zodOutputFormat(SchemaReponseRequerant),
        effort: "low",
      },
      system: construirePromptSysteme(scenario),
      messages: [
        ...historiqueEnMessages(historique),
        { role: "user", content: saisieOperateur },
      ],
    });

    if (reponse.stop_reason === "refusal" || !reponse.parsed_output) {
      return null;
    }

    return reponse.parsed_output;
  } catch {
    return null;
  }
}
