export const cities = {
    // Asia & Pasifik
    jakarta: { name: 'Jakarta', lat: -6.2, lng: 106.8 },
    singapore: { name: 'Singapore', lat: 1.35, lng: 103.8 },
    bangkok: { name: 'Bangkok', lat: 13.75, lng: 100.5 },
    tokyo: { name: 'Tokyo', lat: 35.68, lng: 139.76 },
    seoul: { name: 'Seoul', lat: 37.56, lng: 126.97 },
    beijing: { name: 'Beijing', lat: 39.9, lng: 116.4 },
    newDelhi: { name: 'New Delhi', lat: 28.61, lng: 77.2 },
    canberra: { name: 'Canberra', lat: -35.28, lng: 149.13 },

    // Timur Tengah & Afrika
    abuDhabi: { name: 'Abu Dhabi', lat: 24.45, lng: 54.37 },
    cairo: { name: 'Cairo', lat: 30.04, lng: 31.23 },

    // Eropa
    berlin: { name: 'Berlin', lat: 52.52, lng: 13.4 },
    london: { name: 'London', lat: 51.5, lng: -0.12 },
    paris: { name: 'Paris', lat: 48.85, lng: 2.35 },
    rome: { name: 'Rome', lat: 41.9, lng: 12.5 },

    // Amerika
    washingtonDC: { name: 'Washington, D.C.', lat: 38.9, lng: -77.03 },
    ottawa: { name: 'Ottawa', lat: 45.42, lng: -75.69 },
    brasilia: { name: 'Brasília', lat: -15.79, lng: -47.88 },
};

// Rute berantai antar ibukota negara (A -> B -> C -> D)
const connections = [
    // Rute Asia & Pasifik
    ['jakarta', 'singapore', 0.1],
    ['singapore', 'bangkok', 0.1],
    ['bangkok', 'newDelhi', 0.18],
    ['singapore', 'tokyo', 0.25],
    ['tokyo', 'seoul', 0.08],
    ['tokyo', 'beijing', 0.12],
    ['beijing', 'canberra', 0.35],

    // Rute Timur Tengah & Afrika
    ['newDelhi', 'abuDhabi', 0.18],
    ['abuDhabi', 'cairo', 0.18],
    ['cairo', 'rome', 0.18],

    // Rute Eropa
    ['rome', 'paris', 0.12],
    ['paris', 'london', 0.08],
    ['london', 'berlin', 0.12],

    // Rute Trans-Atlantik & Amerika
    ['london', 'washingtonDC', 0.32],
    ['washingtonDC', 'ottawa', 0.1],
    ['washingtonDC', 'brasilia', 0.35],

    // Rute Trans-Pasifik (Menghubungkan ujung Barat ke Timur)
    ['tokyo', 'washingtonDC', 0.42],
    ['canberra', 'jakarta', 0.28],
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

export const COUNTRIES_URL = '/data/globe-countries.json';