// Road routes for the live maps: the line to draw, distance, travel time and turn-by-turn steps,
// from OSRM (OpenStreetMap routing). See distance.js for the OSRM_URL note.
const OSRM_URL = process.env.OSRM_URL || 'https://router.project-osrm.org';
const OSRM_TIMEOUT_MS = 5000;
// Maps refresh every few seconds; reuse a route while the rider is still near the same spot.
const CACHE_TTL_MS = 30 * 1000;
const CACHE_MAX_ENTRIES = 500;

const cache = new Map();

const MODIFIER_TEXT = {
  left: 'Turn left',
  right: 'Turn right',
  'slight left': 'Bear left',
  'slight right': 'Bear right',
  'sharp left': 'Turn sharp left',
  'sharp right': 'Turn sharp right',
  straight: 'Continue straight',
  uturn: 'Make a U-turn',
};

/** Plain-English instruction for one OSRM step, e.g. "Turn left onto Riverside Drive". */
function describeStep(step) {
  const { type, modifier, exit } = step.maneuver;
  const road = step.name ? ` onto ${step.name}` : '';
  switch (type) {
    case 'depart':
      return step.name ? `Start on ${step.name}` : 'Start';
    case 'arrive':
      return 'Arrive at the destination';
    case 'roundabout':
    case 'rotary':
    case 'exit roundabout':
    case 'exit rotary':
      return exit ? `At the roundabout, take exit ${exit}${road}` : `Go through the roundabout${road}`;
    case 'merge':
      return `Merge${road}`;
    case 'on ramp':
      return `Take the ramp${road}`;
    case 'off ramp':
      return `Take the exit${road}`;
    case 'fork':
      return `Keep ${modifier?.includes('left') ? 'left' : 'right'} at the fork${road}`;
    case 'new name':
    case 'continue':
      return `Continue${road}`;
    default:
      return `${MODIFIER_TEXT[modifier] ?? 'Continue'}${road}`;
  }
}

const cacheKey = (from, to, steps) =>
  [from.lat.toFixed(4), from.lng.toFixed(4), to.lat.toFixed(4), to.lng.toFixed(4), steps ? 's' : ''].join(',');

/**
 * Route between two points: { coordinates: [[lat, lng], ...], distance_m, duration_s, steps? }.
 * Returns null if routing is unavailable (the maps then just show the markers).
 */
async function getRoute(from, to, { steps = false } = {}) {
  const key = cacheKey(from, to, steps);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.route;

  try {
    const url = `${OSRM_URL}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=${steps}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(OSRM_TIMEOUT_MS) });
    const data = await response.json();
    if (!response.ok || data.code !== 'Ok' || !data.routes?.length) throw new Error(`OSRM route failed: ${data.code ?? response.status}`);

    const best = data.routes[0];
    const route = {
      // GeoJSON is [lng, lat]; maps want [lat, lng].
      coordinates: best.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distance_m: Math.round(best.distance),
      duration_s: Math.round(best.duration),
      ...(steps
        ? {
            steps: best.legs.flatMap((leg) => leg.steps).map((step) => ({
              instruction: describeStep(step),
              distance_m: Math.round(step.distance),
            })),
          }
        : {}),
    };

    if (cache.size >= CACHE_MAX_ENTRIES) cache.delete(cache.keys().next().value);
    cache.set(key, { at: Date.now(), route });
    return route;
  } catch (error) {
    console.warn('Route unavailable:', error.message);
    return null;
  }
}

module.exports = { getRoute, describeStep };
