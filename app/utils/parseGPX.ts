import GpxParser from 'gpxparser';

function toRadians(deg: number) {
    return deg * Math.PI / 180;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371000; // Earth's radius in meters
    const φ1 = toRadians(lat1);
    const φ2 = toRadians(lat2);
    const Δφ = toRadians(lat2 - lat1);
    const Δλ = toRadians(lon2 - lon1);

    const a = Math.sin(Δφ / 2) ** 2 +
                        Math.cos(φ1) * Math.cos(φ2) *
                        Math.sin(Δλ / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in meters
}

function calculateHeading(lat1: number, lon1: number, lat2: number, lon2: number) {
    const y = Math.sin(toRadians(lon2 - lon1)) * Math.cos(toRadians(lat2));
    const x = Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) - Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(toRadians(lon2 - lon1));
    const θ = Math.atan2(y, x);
    return (θ * 180 / Math.PI + 360) % 360; // in degrees
}

export async function parseGpxFile(file: File) {
    const text = await file.text();
    const parser = new GpxParser();
    parser.parse(text);

    const rawPoints = parser.tracks[0].points;

    const points = rawPoints.map((pt, i) => {
        const prev = rawPoints[i - 1];
        let speed: number | null = null;
        let heading: number | null = null;

        if (prev) {
            const dist = calculateDistance(prev.lat, prev.lon, pt.lat, pt.lon); // meters
            const timeDiff = (new Date(pt.time).getTime() - new Date(prev.time).getTime()) / 1000; // seconds

            if (timeDiff > 0) {
                const metersPerSecond = dist / timeDiff; // meters per second
                speed = metersPerSecond * 2.23694; // convert to miles per hour (mph)
                heading = calculateHeading(prev.lat, prev.lon, pt.lat, pt.lon); // degrees
            }
        }

        return {
            lat: pt.lat,
            lon: pt.lon,
            ele: pt.ele,
            time: pt.time,
            speed,
            heading,
        };
    });

    return points;
}