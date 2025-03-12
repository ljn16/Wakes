export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    return Response.json({
      lakeId: params.id,
      tourVideos: ["video1.mp4", "video2.mp4", "video3.mp4"]
    });
  }