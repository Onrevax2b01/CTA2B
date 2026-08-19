import { NextResponse } from "next/server";

import { listerResumes } from "@/lib/scenarios";

export async function GET() {
  return NextResponse.json({ scenarios: listerResumes() });
}
