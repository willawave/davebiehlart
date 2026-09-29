import { fromLonLat } from 'ol/proj';
import { MapPoint, extentOf, toFeatures } from './multi-point';

const POINTS: MapPoint[] = [
  { id: 'a', name: 'A', latitude: 41.26, longitude: -95.94 },
  { id: 'b', name: 'B', latitude: 40.81, longitude: -96.7 },
];

// OpenLayers' drawing needs a real browser (the web E2E suite covers it); the geometry
// helpers don't.
describe('multi-point map helpers', () => {
  it('should make one named, identified pin per point', () => {
    const features = toFeatures(POINTS);
    expect(features.map((f) => [f.getId(), f.get('name')])).toEqual([
      ['a', 'A'],
      ['b', 'B'],
    ]);
    expect(features[0].getGeometry()?.getCoordinates()).toEqual(fromLonLat([-95.94, 41.26]));
  });

  it('should box every point, or nothing for no points', () => {
    const [west, south] = fromLonLat([-96.7, 40.81]);
    const [east, north] = fromLonLat([-95.94, 41.26]);
    expect(extentOf(POINTS)).toEqual([west, south, east, north]);
    expect(extentOf([])).toBeNull();
  });
});
