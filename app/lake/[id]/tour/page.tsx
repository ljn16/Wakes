export default async function LakePage({ params }: LakePageProps) {
    const res = await fetch(`http://localhost:3000/api/lake/${params.id}`);
    
    if (!res.ok) return notFound();
    
    const lake = await res.json();
  
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">{lake.name}</h1>
        <p>Distance: {lake.distance}</p>
  
        <h2 className="text-xl mt-4 font-semibold">Anchor Spots</h2>
        <ul className="list-disc pl-4">
          {lake.anchorSpots.map((spot: any, index: number) => (
            <li key={index}>{spot.name}</li>
          ))}
        </ul>
  
        <h2 className="text-xl mt-4 font-semibold">Docks</h2>
        <ul className="list-disc pl-4">
          {lake.docks.map((dock: any, index: number) => (
            <li key={index}>{dock.name}</li>
          ))}
        </ul>
  
        {lake.media && lake.media.some((m: any) => m.type === 'application/gpx+xml') && (
          <>
            <h2 className="text-xl mt-4 font-semibold">GPX Tracks</h2>
            <ul className="list-disc pl-4">
              {lake.media
                .filter((m: any) => m.type === 'application/gpx+xml')
                .map((gpx: any, index: number) => (
                  <li key={index}>
                    <a href={gpx.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                      {gpx.name}
                    </a>
                  </li>
                ))}
            </ul>
          </>
        )}
      </div>
    );
  }