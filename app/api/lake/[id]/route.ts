import { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return Response.json({
    id: params.id,
    name: `Lake ${params.id}`,
    anchorSpots: [{ name: "Spot A" }, { name: "Spot B" }],
    docks: [{ name: "Main Dock" }]
  });
}