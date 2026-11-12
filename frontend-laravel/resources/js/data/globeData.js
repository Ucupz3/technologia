export const cities = {
    jakarta: { name: 'Jakarta', lat: -6.2, lng: 106.8 },
    singapore: { name: 'Singapore', lat: 1.35, lng: 103.8 },
    tokyo: { name: 'Tokyo', lat: 35.6, lng: 139.6 },
    london: { name: 'London', lat: 51.5, lng: -0.1 },
    sanFrancisco: { name: 'San Francisco', lat: 37.7, lng: -122.4 },
    newYork: { name: 'New York', lat: 40.7, lng: -74.0 },
    sydney: { name: 'Sydney', lat: -33.8, lng: 151.2 },
    dubai: { name: 'Dubai', lat: 25.2, lng: 55.2 },
};

// [asal, tujuan, ketinggian arc]. Sengaja tidak semua kota terhubung agar natural.
const connections = [
    ['jakarta', 'singapore', 0.15],
    ['jakarta', 'tokyo', 0.3],
    ['jakarta', 'dubai', 0.3],
    ['jakarta', 'sydney', 0.25],
    ['singapore', 'london', 0.45],
    ['tokyo', 'sanFrancisco', 0.4],
    ['dubai', 'london', 0.25],
    ['london', 'newYork', 0.3],
    ['newYork', 'sanFrancisco', 0.2],
    ['singapore', 'sydney', 0.2],
];

export const arcs = connections.map(([from, to, arcAlt], i) => ({
    order: i,
    startLat: cities[from].lat,
    startLng: cities[from].lng,
    endLat: cities[to].lat,
    endLng: cities[to].lng,
    arcAlt,
}));

export const points = Object.values(cities);

// Lokasi GeoJSON negara (taruh di public/data/)
export const COUNTRIES_URL = '/data/globe-countries.json';
