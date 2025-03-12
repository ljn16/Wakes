export async function GET() {
    return Response.json([
      { id: 1, name: "Lake Serenity", distance: "5 miles" },
      { id: 2, name: "Crystal Lake", distance: "10 miles" }
    ]);
  }