export async function GET() {
    return Response.json([
      { id: 1, name: "Lake Serenity", distance: "5 miles" },
      { id: 2, name: "Crystal Lake", distance: "10 miles" }
    ]);
  }


  // export async function GET(request: Request) {
  //   const url = new URL(request.url);
  //   let latitude = url.searchParams.get("latitude");
  //   let longitude = url.searchParams.get("longitude");
  
  //   // Provide default location if not provided
  //   if (!latitude || !longitude) {
  //       latitude = "40.7128";
  //       longitude = "-74.0060";
  //   }
  
  //   const lat = parseFloat(latitude);
  //   const lon = parseFloat(longitude);
  
  //   // Fetch nearby lakes from OpenStreetMap Nominatim API
  //   const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=lake&bounded=1&viewbox=${lon - 0.1},${lat + 0.1},${lon + 0.1},${lat - 0.1}`);
  //   const data = await response.json();
  
  //   const lakes = data.map((lake: any, index: number) => ({
  //       id: index + 1,
  //       name: lake.display_name,
  //       latitude: parseFloat(lake.lat),
  //       longitude: parseFloat(lake.lon),
  //       distance: "Unknown", // Distance can be computed if needed
  //   }));
  
  //   return new Response(JSON.stringify(lakes), { headers: { "Content-Type": "application/json" } });
  // }