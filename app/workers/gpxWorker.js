import { XMLParser } from 'fast-xml-parser';

self.onmessage = async function (e) {
  const { file } = e.data;

  try {
    const text = await file.text();
    const parser = new XMLParser();
    const gpx = parser.parse(text);

    const trkpts = gpx?.gpx?.trk?.trkseg?.trkpt;

    if (!trkpts || !Array.isArray(trkpts)) {
      throw new Error('No track points found in GPX');
    }

    const points = [];

    for (let i = 0; i < trkpts.length; i += 10) {
      const trkpt = trkpts[i];
      const lat = parseFloat(trkpt['@_lat']);
      const lon = parseFloat(trkpt['@_lon']);

      if (isNaN(lat) || isNaN(lon)) continue;

      const ele = trkpt.ele !== undefined ? parseFloat(trkpt.ele) : undefined;
      points.push({ lat, lon, ele });
    }

    self.postMessage({ success: true, points });
  } catch (err) {
    self.postMessage({ success: false, error: err.message });
  }
};