import Feature from 'ol/Feature';
import View from 'ol/View';
import { boundingExtent } from 'ol/extent';
import type { Extent } from 'ol/extent';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import Cluster from 'ol/source/Cluster';
import VectorSource from 'ol/source/Vector';
import type { FeatureLike } from 'ol/Feature';
import { LatLon, PIN, clusterStyle, createMap, project } from './ol-map';

export interface MapPoint extends LatLon {
  id: string;
  name: string;
}

export interface MultiPointMapHandle {
  setPoints(points: readonly MapPoint[]): void;
  destroy(): void;
}

const FIT = { padding: [48, 48, 48, 48], maxZoom: 14, duration: 0 };

export function toFeatures(points: readonly MapPoint[]): Feature<Point>[] {
  return points.map((point) => {
    const feature = new Feature({ geometry: new Point(project(point)), name: point.name });
    feature.setId(point.id);
    return feature;
  });
}

// The projected box around every point; null for none.
export function extentOf(points: readonly MapPoint[]): Extent | null {
  return points.length ? boundingExtent(points.map(project)) : null;
}

// The pins inside a clustered feature, or the feature itself.
function membersOf(feature: FeatureLike): FeatureLike[] {
  return (feature.get('features') as FeatureLike[] | undefined) ?? [feature];
}

// A map of many pins, grouped into numbered clusters where they crowd together. Clicking a
// cluster zooms in on it; clicking a pin reports its id.
export function createMultiPointMap(
  target: HTMLElement,
  points: readonly MapPoint[],
  selected: (id: string) => void,
): MultiPointMapHandle {
  const source = new VectorSource<Feature<Point>>();
  const layer = new VectorLayer({
    source: new Cluster({ distance: 40, source }),
    style: (feature) => {
      const count = membersOf(feature).length;
      return count > 1 ? clusterStyle(count) : PIN;
    },
  });
  const view = new View({ center: [0, 0], zoom: 2 });
  const map = createMap(target, layer, view);

  function setPoints(next: readonly MapPoint[]): void {
    source.clear();
    source.addFeatures(toFeatures(next));
    const extent = extentOf(next);
    if (extent) view.fit(extent, { ...FIT, size: map.getSize() });
  }

  map.on('click', (event) => {
    const [hit] = map.getFeaturesAtPixel(event.pixel, { hitTolerance: 4 });
    if (!hit) return;
    const members = membersOf(hit);
    const extent = boundingExtent(
      members.map((member) => (member.getGeometry() as Point).getCoordinates()),
    );
    // Pins at the same spot never split apart, so the last zoom level picks the first.
    const zoom = view.getZoom() ?? 0;
    if (members.length > 1 && zoom < (view.getMaxZoom() ?? 28) - 1) {
      view.fit(extent, { padding: FIT.padding, maxZoom: zoom + 3, duration: 300 });
      return;
    }
    const id = members[0].getId();
    if (id !== undefined) selected(String(id));
  });

  map.on('pointermove', (event) => {
    const [hit] = map.getFeaturesAtPixel(event.pixel, { hitTolerance: 4 });
    const members = hit ? membersOf(hit) : [];
    target.style.cursor = hit ? 'pointer' : '';
    target.title =
      members.length === 1 ? String(members[0].get('name') ?? '') : hit ? 'Zoom in' : '';
  });

  // Setting the target measured the map, so the fit knows its size.
  setPoints(points);

  return {
    setPoints,
    destroy() {
      map.setTarget(undefined);
    },
  };
}
