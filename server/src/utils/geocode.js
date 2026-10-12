// Turns a typed address into map coordinates using Photon (OpenStreetMap data), the same
// service the order form's address suggestions use. Results are limited to Kenya and biased
// towards Nairobi.
const PHOTON_URL = process.env.PHOTON_URL || 'https://photon.komoot.io/api/';
const GEOCODE_TIMEOUT_MS = 5000;
const BIAS = { lat: -1.2864, lng: 36.8172 };
const COUNTRY_CODE = 'KE';

/** Best Kenyan match for an address, as { lat, lng }, or null if the map doesn't know it. */
async function geocodeAddress(address) {
  const query = String(address ?? '').trim();
  if (!query) return null;

  const params = new URLSearchParams({ q: query, limit: '5', lang: 'en', lat: String(BIAS.lat), lon: String(BIAS.lng) });
  try {
    const response = await fetch(`${PHOTON_URL}?${params}`, { signal: AbortSignal.timeout(GEOCODE_TIMEOUT_MS) });
    if (!response.ok) throw new Error(`Photon responded ${response.status}`);
    const data = await response.json();
    const match = (data.features ?? []).find((feature) => feature.properties?.countrycode === COUNTRY_CODE);
    if (!match) return null;
    const [lng, lat] = match.geometry.coordinates;
    return { lat, lng };
  } catch (error) {
    console.warn('Geocoding failed:', error.message);
    return null;
  }
}

module.exports = { geocodeAddress };
