// Distances between two points for rider pay.
// Road distance comes from OSRM (OpenStreetMap routing). The public demo server is for light
// use; set OSRM_URL to a self-hosted instance for production volume.
const OSRM_URL = process.env.OSRM_URL || 'https://router.project-osrm.org';
const OSRM_TIMEOUT_MS = 5000;
const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees) => (degrees * Math.PI) / 180;

/** Great-circle ("as the crow flies") distance in km. */
function straightLineKm(from, to) {
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

async function roadKm(from, to) {
  const url = `${OSRM_URL}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
  const response = await fetch(url, { signal: AbortSignal.timeout(OSRM_TIMEOUT_MS) });
  const data = await response.json();
  if (!response.ok || data.code !== 'Ok' || !data.routes?.length) {
    throw new Error(`OSRM route failed: ${data.code ?? response.status}`);
  }
  return data.routes[0].distance / 1000;
}

/**
 * Distance between two points in km, rounded to 0.1 km. Uses the road route, falling back to the
 * straight line (which under-counts in town) only if routing is unavailable.
 * Returns { km, source: 'road' | 'straight_line' }.
 */
async function tripDistance(from, to) {
  const round = (km) => Math.round(km * 10) / 10;
  try {
    return { km: round(await roadKm(from, to)), source: 'road' };
  } catch (error) {
    console.warn('Road distance unavailable, using straight line:', error.message);
    return { km: round(straightLineKm(from, to)), source: 'straight_line' };
  }
}

module.exports = { straightLineKm, tripDistance };
