/**
 * Address suggestions from OpenStreetMap data via Photon (https://photon.komoot.io).
 * Photon is built for search-as-you-type; OSM's own Nominatim API forbids autocomplete use.
 */
const PHOTON_URL = process.env.NEXT_PUBLIC_PHOTON_URL ?? "https://photon.komoot.io/api/";

// Bias results towards Nairobi and keep only Kenyan addresses.
const BIAS = { lat: -1.2864, lon: 36.8172 };
const COUNTRY_CODE = "KE";

export type AddressSuggestion = {
  id: string;
  /** Main line, e.g. "Yaya Centre" or "Argwings Kodhek Road 12". */
  title: string;
  /** Context line, e.g. "Kilimani, Nairobi". */
  subtitle: string;
  /** Full text stored as the pickup address. */
  label: string;
  lat: number;
  lng: number;
};

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_type?: string;
    osm_id?: number;
    name?: string;
    housenumber?: string;
    street?: string;
    locality?: string;
    district?: string;
    city?: string;
    county?: string;
    state?: string;
    countrycode?: string;
  };
};

function uniqueParts(parts: (string | undefined)[]) {
  const seen = new Set<string>();
  return parts.filter((part): part is string => {
    if (!part) return false;
    const key = part.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function toSuggestion(feature: PhotonFeature): AddressSuggestion {
  const p = feature.properties;
  const [lng, lat] = feature.geometry.coordinates;
  const streetLine = uniqueParts([p.street, p.housenumber]).join(" ");
  const title = p.name || streetLine || p.locality || p.city || "Unnamed place";
  // Strip OSM admin suffixes ("Kilimani division" -> "Kilimani") so the context reads naturally.
  const area = (p.locality || p.district)?.replace(/\s+(location|division|sub-?location|ward)$/i, "");
  const subtitle = uniqueParts([p.name && streetLine !== title ? streetLine : undefined, area, p.city || p.county]).join(", ");

  return {
    id: `${p.osm_type ?? ""}${p.osm_id ?? `${lat},${lng}`}`,
    title,
    subtitle,
    label: uniqueParts([title, subtitle]).join(", "),
    lat,
    lng,
  };
}

export async function searchAddresses(query: string, signal?: AbortSignal): Promise<AddressSuggestion[]> {
  const params = new URLSearchParams({
    q: query,
    limit: "10",
    lang: "en",
    lat: String(BIAS.lat),
    lon: String(BIAS.lon),
  });

  const response = await fetch(`${PHOTON_URL}?${params}`, { signal });
  if (!response.ok) {
    throw new Error(`Address search failed with status ${response.status}`);
  }

  const data = (await response.json()) as { features?: PhotonFeature[] };
  const suggestions = (data.features ?? [])
    .filter((feature) => feature.properties.countrycode === COUNTRY_CODE)
    .map(toSuggestion);

  // Photon can return the same place more than once (e.g. node and way); keep the first.
  const byLabel = new Map<string, AddressSuggestion>();
  for (const suggestion of suggestions) {
    const key = suggestion.label.toLowerCase();
    if (!byLabel.has(key)) byLabel.set(key, suggestion);
  }
  return [...byLabel.values()].slice(0, 5);
}
