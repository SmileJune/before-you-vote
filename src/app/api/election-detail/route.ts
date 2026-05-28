import { NextResponse } from "next/server";
import { getElectionDetail } from "@/domain/election";
import { electionDataset } from "@/domain/generated-election-data";

const cacheControl = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const electionId = searchParams.get("electionId");

  if (!electionId || !electionDataset.elections.some((election) => election.id === electionId)) {
    return NextResponse.json({ status: "invalid_request" }, { status: 400 });
  }

  return NextResponse.json(getElectionDetail(electionDataset, electionId), {
    headers: {
      "Cache-Control": cacheControl
    }
  });
}
