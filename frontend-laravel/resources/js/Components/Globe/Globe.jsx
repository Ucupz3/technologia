import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import ThreeGlobe from 'three-globe';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { getGlobeConfig } from '@/config/globeConfig';
import { arcs, points, COUNTRIES_URL } from '@/data/globeData';

const DEG = Math.PI / 180;

export default function Globe({ theme = 'dark', className = '' }) {
    const mountRef = useRef(null);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        const cfg = getGlobeConfig(theme);
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const lowEnd = (navigator.hardwareConcurrency || 4) <= 4;

        // ---------- Renderer ----------
        const renderer = new THREE.WebGLRenderer({ antialias: !lowEnd, alpha: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowEnd ? 1.5 : 2));
        renderer.setClearColor(0x000000, 0);
        renderer.domElement.style.touchAction = 'pan-y'; // scroll vertikal tetap jalan di mobile
        mount.appendChild(renderer.domElement);

        // ---------- Scene, camera, lights ----------
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, 1, 180, 1800);
        const camDist = 300;
        const lat0 = cfg.initialPosition.lat * DEG;
        camera.position.set(0, camDist * Math.sin(lat0), camDist * Math.cos(lat0));

        scene.add(new THREE.AmbientLight(cfg.ambientLight, 0.6));
        const dl = new THREE.DirectionalLight(cfg.directionalLeftLight, 1);
        dl.position.set(-400, 100, 400);
        scene.add(dl);
        const dt = new THREE.DirectionalLight(cfg.directionalTopLight, 1);
        dt.position.set(-200, 500, 200);
        scene.add(dt);
        const pl = new THREE.PointLight(cfg.pointLight, 0.8);
        pl.position.set(-200, 500, 200);
        scene.add(pl);

        // ---------- Globe ----------
        const globe = new ThreeGlobe({ waitForGlobeReady: true, animateIn: !reduceMotion })
            .showAtmosphere(cfg.showAtmosphere)
            .atmosphereColor(cfg.atmosphereColor)
            .atmosphereAltitude(cfg.atmosphereAltitude);

        const mat = globe.globeMaterial();
        mat.color = new THREE.Color(cfg.globeColor);
        mat.emissive = new THREE.Color(cfg.emissive);
        mat.emissiveIntensity = cfg.emissiveIntensity;
        mat.shininess = cfg.shininess * 100; // Phong shininess berskala lebih besar

        // Putar globe agar lng awal menghadap kamera
        globe.rotation.y = -cfg.initialPosition.lng * DEG;

        const arcData = arcs.map((a, i) => ({ ...a, color: cfg.arcColors[i % cfg.arcColors.length] }));
        const animTime = reduceMotion ? 0 : cfg.arcTime * cfg.arcSpeedFactor;

        globe
            .arcsData(arcData)
            .arcColor((e) => e.color)
            .arcAltitude((e) => e.arcAlt)
            .arcStroke(0.5)
            .arcDashLength(cfg.arcLength)
            .arcDashInitialGap((e) => e.order)
            .arcDashGap(15)
            .arcDashAnimateTime(() => animTime)
            .pointsData(points)
            .pointColor(() => cfg.arcColors[0])
            .pointsMerge(true)
            .pointAltitude(0)
            .pointRadius(cfg.pointSize / 4)
            .ringColor(() => (t) => `rgba(${theme === 'light' ? '16,185,129' : '6,182,212'},${1 - t})`)
            .ringMaxRadius(cfg.maxRings * 2)
            .ringPropagationSpeed(2)
            .ringRepeatPeriod(((cfg.arcTime * cfg.arcSpeedFactor) * cfg.arcLength) / cfg.rings);

        scene.add(globe);

        // Polygon benua (hex dots)
        const ac = new AbortController();
        fetch(COUNTRIES_URL, { signal: ac.signal })
            .then((r) => r.json())
            .then((data) => {
                globe
                    .hexPolygonsData(data.features)
                    .hexPolygonResolution(3)
                    .hexPolygonMargin(0.7)
                    .showAtmosphere(cfg.showAtmosphere)
                    .hexPolygonColor(() => cfg.polygonColor);
            })
            .catch(() => {});

        // Ring berpindah-pindah antar kota
        let ringTimer;
        if (!reduceMotion) {
            ringTimer = setInterval(() => {
                const picks = [...points].sort(() => 0.5 - Math.random()).slice(0, Math.min(cfg.maxRings, points.length));
                globe.ringsData(picks);
            }, 2500);
        }

        // ---------- Controls ----------
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.enablePan = false;
        controls.enableZoom = false;
        controls.minPolarAngle = Math.PI / 3.5;
        controls.maxPolarAngle = Math.PI - Math.PI / 3.5;
        controls.autoRotate = cfg.autoRotate && !reduceMotion;
        controls.autoRotateSpeed = cfg.autoRotateSpeed;

        // ---------- Resize ----------
        const resize = () => {
            const { clientWidth: w, clientHeight: h } = mount;
            if (!w || !h) return;
            renderer.setSize(w, h, false);
            renderer.domElement.style.width = '100%';
            renderer.domElement.style.height = '100%';
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        };
        const ro = new ResizeObserver(resize);
        ro.observe(mount);
        resize();

        // ---------- Loop (berhenti saat tidak terlihat) ----------
        let raf = 0;
        let visible = true;
        const loop = () => {
            raf = requestAnimationFrame(loop);
            controls.update();
            renderer.render(scene, camera);
        };
        const start = () => { if (!raf && visible && !document.hidden) loop(); };
        const stop = () => { cancelAnimationFrame(raf); raf = 0; };

        const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); });
        io.observe(mount);
        const onVis = () => (document.hidden ? stop() : start());
        document.addEventListener('visibilitychange', onVis);
        start();

        // ---------- Cleanup ----------
        return () => {
            stop();
            ac.abort();
            clearInterval(ringTimer);
            io.disconnect();
            ro.disconnect();
            document.removeEventListener('visibilitychange', onVis);
            controls.dispose();
            scene.traverse((o) => {
                if (o.geometry) o.geometry.dispose();
                if (o.material) {
                    (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
                        Object.values(m).forEach((v) => v && v.isTexture && v.dispose());
                        m.dispose();
                    });
                }
            });
            if (typeof globe._destructor === 'function') globe._destructor();
            renderer.dispose();
            renderer.forceContextLoss();
            renderer.domElement.remove();
        };
    }, [theme]);

    return <div ref={mountRef} className={`h-full w-full cursor-grab active:cursor-grabbing ${className}`} />;
}
