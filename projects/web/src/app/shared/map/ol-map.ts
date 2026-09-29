import Map from 'ol/Map';
import View from 'ol/View';
import { defaults as defaultInteractions } from 'ol/interaction/defaults';
import MouseWheelZoom from 'ol/interaction/MouseWheelZoom';
import { platformModifierKeyOnly } from 'ol/events/condition';
import TileLayer from 'ol/layer/Tile';
import type VectorLayer from 'ol/layer/Vector';
import { fromLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';
import CircleStyle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import Text from 'ol/style/Text';

// Shared OpenLayers setup for the site's maps. Only the lazily loaded map modules import
// this file, so OpenLayers never reaches the server render or the initial bundle.

export interface LatLon {
  latitude: number;
  longitude: number;
}

// Web Mercator, OpenLayers' default view projection.
export function project({ latitude, longitude }: LatLon): number[] {
  return fromLonLat([longitude, latitude]);
}

// The site's bronze, with a white ring so the pin reads on any tile.
const BRONZE = '#7a4a1e';

export const PIN = new Style({
  image: new CircleStyle({
    radius: 9,
    fill: new Fill({ color: BRONZE }),
    stroke: new Stroke({ color: '#fff', width: 3 }),
  }),
});

// A cluster of `count` pins.
export function clusterStyle(count: number): Style {
  return new Style({
    image: new CircleStyle({
      radius: 15,
      fill: new Fill({ color: BRONZE }),
      stroke: new Stroke({ color: '#fff', width: 3 }),
    }),
    text: new Text({
      text: String(count),
      font: '600 13px Inter, system-ui, sans-serif',
      fill: new Fill({ color: '#fff' }),
    }),
  });
}

// An OpenStreetMap base map. The mouse wheel zooms only with Ctrl/⌘ held, so a visitor
// scrolling the page past the map keeps scrolling the page.
export function createMap(target: HTMLElement, overlay: VectorLayer, view: View): Map {
  return new Map({
    target,
    layers: [new TileLayer({ source: new OSM() }), overlay],
    view,
    interactions: defaultInteractions({ mouseWheelZoom: false }).extend([
      new MouseWheelZoom({ condition: platformModifierKeyOnly }),
    ]),
  });
}
