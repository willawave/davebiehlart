import Feature from 'ol/Feature';
import Map from 'ol/Map';
import View from 'ol/View';
import { containsCoordinate } from 'ol/extent';
import Point from 'ol/geom/Point';
import Translate from 'ol/interaction/Translate';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat, toLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import CircleStyle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';

// OpenLayers lives only here, so FormMap can load it on demand after the form renders.

export interface LonLat {
  longitude: number;
  latitude: number;
}

export interface LocationPicker {
  // Moves the pin, panning only if it left the visible area.
  place(position: LonLat): void;
  // While disabled, clicks and drags leave the pin where it is; the map still pans and zooms.
  setEnabled(enabled: boolean): void;
  destroy(): void;
}

// Six decimals is about 10 cm: plenty for a statue, and short enough to read.
export function roundCoordinate(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

const PIN = new Style({
  image: new CircleStyle({
    radius: 9,
    fill: new Fill({ color: '#7a4a1e' }),
    stroke: new Stroke({ color: '#fff', width: 3 }),
  }),
});

// A zoomable, scrollable map with one pin. Clicking the map moves the pin there, and the
// pin can be dragged; both report the new position through `moved`.
export function createLocationPicker(
  target: HTMLElement,
  start: LonLat,
  moved: (position: LonLat) => void,
): LocationPicker {
  const toMap = ({ longitude, latitude }: LonLat) => fromLonLat([longitude, latitude]);
  const report = (coordinate: number[]) => {
    const [longitude, latitude] = toLonLat(coordinate);
    moved({ longitude: roundCoordinate(longitude), latitude: roundCoordinate(latitude) });
  };

  const pin = new Feature(new Point(toMap(start)));
  const map = new Map({
    target,
    layers: [
      new TileLayer({ source: new OSM() }),
      new VectorLayer({ source: new VectorSource({ features: [pin] }), style: PIN }),
    ],
    view: new View({ center: toMap(start), zoom: 15 }),
  });

  // The pin is the only feature, so any drag that starts on a feature drags the pin.
  const drag = new Translate({ hitTolerance: 6 });
  drag.on('translateend', () => report((pin.getGeometry() as Point).getCoordinates()));
  map.addInteraction(drag);

  let enabled = true;
  map.on('click', (event) => {
    // A click that ends a drag has already been reported.
    if (!enabled || map.hasFeatureAtPixel(event.pixel, { hitTolerance: 6 })) return;
    pin.setGeometry(new Point(event.coordinate));
    report(event.coordinate);
  });
  map.on('pointermove', (event) => {
    target.style.cursor =
      enabled && map.hasFeatureAtPixel(event.pixel, { hitTolerance: 6 }) ? 'grab' : '';
  });

  return {
    place(position) {
      const coordinate = toMap(position);
      pin.setGeometry(new Point(coordinate));
      const view = map.getView();
      if (!containsCoordinate(view.calculateExtent(map.getSize()), coordinate)) {
        view.animate({ center: coordinate, duration: 250 });
      }
    },
    setEnabled(value) {
      enabled = value;
      drag.setActive(value);
    },
    destroy() {
      map.setTarget(undefined);
    },
  };
}
