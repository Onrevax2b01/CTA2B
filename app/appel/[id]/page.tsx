import { notFound } from "next/navigation";

import { chargerScenario, listerResumes } from "@/lib/scenarios";
import { EcranAppel } from "./EcranAppel";

export default async function PageAppel({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scenario = chargerScenario(id);

  if (!scenario) {
    notFound();
  }

  const resume = listerResumes().find((r) => r.id === id);

  return (
    <EcranAppel
      scenarioId={id}
      libelleNeutre={resume?.libelleNeutre ?? "Appel"}
    />
  );
}
