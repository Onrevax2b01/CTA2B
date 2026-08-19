import { redirect } from "next/navigation";

import { scenarioAleatoire } from "@/lib/scenarios";

// Le tirage doit être recalculé à chaque visite, jamais figé au build.
export const dynamic = "force-dynamic";

export default function PageTirageAleatoire() {
  const scenario = scenarioAleatoire();
  redirect(`/appel/${scenario.id}`);
}
