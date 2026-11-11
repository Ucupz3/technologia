// Konfigurasi globe. Dark & Light dipisah agar mudah dikelola.
const base = {
    showAtmosphere: true,
    atmosphereAltitude: 0.1,
    arcTime: 1000,
    arcLength: 0.9,
    // Pengali durasi animasi arc supaya gerakannya tidak terlalu cepat
    arcSpeedFactor: 2.5,
    rings: 1,
    maxRings: 3,
    initialPosition: { lat: -6.2, lng: 106.8 },
    autoRotate: true,
    autoRotateSpeed: 0.5,
};

export const darkConfig = {
    ...base,
    pointSize: 4,
    globeColor: '#062056',
    atmosphereColor: '#FFFFFF',
    emissive: '#062056',
    emissiveIntensity: 0.1,
    shininess: 0.9,
    polygonColor: 'rgba(255,255,255,0.7)',
    ambientLight: '#38bdf8',
    directionalLeftLight: '#ffffff',
    directionalTopLight: '#ffffff',
    pointLight: '#ffffff',
    arcColors: ['#06b6d4', '#3b82f6', '#6366f1'],
};

export const lightConfig = {
    ...base,
    pointSize: 6,
    globeColor: '#bfdbfe',
    atmosphereColor: '#e0f2fe',
    emissive: '#dbeafe',
    emissiveIntensity: 0.3,
    shininess: 0.7,
    polygonColor: 'rgba(16,185,129,1)',
    ambientLight: '#ffffff',
    directionalLeftLight: '#f3f4f6',
    directionalTopLight: '#e5e7eb',
    pointLight: '#ffffff',
    arcColors: ['#10b981', '#059669', '#047857'],
};

export const getGlobeConfig = (theme) => (theme === 'light' ? lightConfig : darkConfig);
