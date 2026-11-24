import { geoContains, geoOrthographic } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type {
  Feature,
  FeatureCollection,
  MultiPolygon,
  Polygon,
} from "geojson";
import landTopology from "world-atlas/land-110m.json";

export const GLOBE_SIZE = 440;
/** Orthographic rotate: Europe, Iran, and eastern Canada in view */
export const GLOBE_ROTATE: [number, number] = [-10, -32];
const SAMPLE_STEP = 2.5;

export type GlobePin = {
  slug: string;
  nameFa: string;
  flagEmoji: string;
  x: number;
  y: number;
  isOrigin?: boolean;
};

type LandTopology = Topology<{ land: GeometryCollection }>;

const PIN_COORDS: Record<
  string,
  {
    lng: number;
    lat: number;
    nameFa: string;
    flagEmoji: string;
    isOrigin?: boolean;
  }
> = {
  iran: {
    lng: 53.7,
    lat: 32.4,
    nameFa: "ایران",
    flagEmoji: "🇮🇷",
    isOrigin: true,
  },
  germany: { lng: 10.4, lat: 51.2, nameFa: "آلمان", flagEmoji: "🇩🇪" },
  italy: { lng: 12.5, lat: 41.9, nameFa: "ایتالیا", flagEmoji: "🇮🇹" },
  hungary: { lng: 19.5, lat: 47.2, nameFa: "مجارستان", flagEmoji: "🇭🇺" },
  turkey: { lng: 35.2, lat: 39.0, nameFa: "ترکیه", flagEmoji: "🇹🇷" },
  canada: { lng: -75.7, lat: 45.4, nameFa: "کانادا", flagEmoji: "🇨🇦" },
};

/** Destinations that cycle when no country is selected */
export const DEFAULT_FLIGHT_CYCLE = ["germany", "italy", "canada"] as const;

export type DottedGlobeData = {
  size: number;
  dotsPath: string;
  pins: GlobePin[];
};

function createProjection(size: number) {
  return geoOrthographic()
    .scale(size / 2.05)
    .translate([size / 2, size / 2])
    .clipAngle(90)
    .rotate([...GLOBE_ROTATE, 0] as [number, number, number]);
}

function getLandFeature():
  | Feature<Polygon | MultiPolygon>
  | FeatureCollection<Polygon | MultiPolygon> {
  const topology = landTopology as unknown as LandTopology;
  return feature(topology, topology.objects.land) as
    | Feature<Polygon | MultiPolygon>
    | FeatureCollection<Polygon | MultiPolygon>;
}

/**
 * Build dotted land path + projected pin positions at build/request time.
 * Single SVG path of `M x y h0` commands — lightweight DOM.
 */
export function buildDottedGlobe(size = GLOBE_SIZE): DottedGlobeData {
  const projection = createProjection(size);
  const land = getLandFeature();
  const commands: string[] = [];

  for (let lat = -90; lat <= 90; lat += SAMPLE_STEP) {
    for (let lng = -180; lng <= 180; lng += SAMPLE_STEP) {
      const point: [number, number] = [lng, lat];
      if (!geoContains(land, point)) continue;
      const projected = projection(point);
      if (!projected) continue;
      const [x, y] = projected;
      commands.push(`M${x.toFixed(1)} ${y.toFixed(1)}h0`);
    }
  }

  const pins: GlobePin[] = [];
  for (const [slug, meta] of Object.entries(PIN_COORDS)) {
    const projected = projection([meta.lng, meta.lat]);
    if (!projected) continue;
    pins.push({
      slug,
      nameFa: meta.nameFa,
      flagEmoji: meta.flagEmoji,
      x: projected[0],
      y: projected[1],
      isOrigin: meta.isOrigin,
    });
  }

  return {
    size,
    dotsPath: commands.join(""),
    pins,
  };
}

export function quadraticArcPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  lift = 48,
): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 - lift;
  return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
}
