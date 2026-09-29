import Feature from 'ol/Feature';
import View from 'ol/View';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { LatLon, PIN, createMap, project } from './ol-map';

export interface SinglePointMapHandle {
  setPosition(position: LatLon): void;
  destroy(): void;
}

// A map centered on one pin.
export function createSinglePointMap(target: HTMLElement, position: LatLon): SinglePointMapHandle {
  const pin = new Feature(new Point(project(position)));
  const layer = new VectorLayer({ source: new VectorSource({ features: [pin] }), style: PIN });
  const view = new View({ center: project(position), zoom: 15 });
  const map = createMap(target, layer, view);

  return {
    setPosition(next) {
      const coordinate = project(next);
      pin.setGeometry(new Point(coordinate));
      view.setCenter(coordinate);
    },
    destroy() {
      map.setTarget(undefined);
    },
  };
}
