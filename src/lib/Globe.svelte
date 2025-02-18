<script>
  import { onMount } from "svelte";
  import * as THREE from "three";
  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
  import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
  import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
  import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";

  // Datenimport (Datei /src/data/routeData.js), z.B. { date: "DD.MM.YYYY", latitude, longitude, atSea, ... }
  import { data } from "/src/data/routeData.js";

  let container;
  let autoRotate = true;

  //
  // A) DATUMSVERARBEITUNG
  //
  let today = new Date();
  today.setHours(0, 0, 0, 0);

  // Hilfsfunktion: DD.MM.YYYY → Date
  function parseDDMMYYYY(dateString) {
    const [day, month, year] = dateString.split(".");
    return new Date(+year, +month - 1, +day);
  }

  // Prüft, ob dateString <= heute
  function isPastOrToday(dateString) {
    const d = parseDDMMYYYY(dateString);
    d.setHours(0, 0, 0, 0);
    return d <= today;
  }

  // Prüft, ob dateString == heute (Tagesgenau)
  function isToday(dateString) {
    const d = parseDDMMYYYY(dateString);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  }

  // Daten sortieren & atSea / null filtern
  const sortedData = [...data]
    .filter((entry) => {
      if (entry.atSea === true) return false;
      if (entry.latitude === null || entry.longitude === null) return false;
      return true;
    })
    .sort((a, b) => {
      return parseDDMMYYYY(a.date) - parseDDMMYYYY(b.date);
    });

  //
  // B) 3D-HILFSFUNKTIONEN
  //
  function latLonToCartesian(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    return new THREE.Vector3(x, y, z);
  }

  function slerpVec3(a, b, t) {
    let dot = a.dot(b);
    dot = Math.min(Math.max(dot, -1), 1);

    const theta = Math.acos(dot) * t;
    const relative = b.clone().sub(a.clone().multiplyScalar(dot));
    relative.normalize();

    return a.clone().multiplyScalar(Math.cos(theta))
             .add(relative.multiplyScalar(Math.sin(theta)));
  }

  function createArc(startPos, endPos, segments = 32, extraHeight = 0.05) {
    const vStart = startPos.clone().normalize();
    const vEnd   = endPos.clone().normalize();

    const rA = startPos.length();
    const rB = endPos.length();
    const avgRadius = (rA + rB) / 2;

    const arcPoints = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      let v = slerpVec3(vStart, vEnd, t);

      const arcFactor = Math.sin(Math.PI * t);
      const addedHeight = extraHeight * arcFactor;

      v.multiplyScalar(avgRadius + addedHeight);
      arcPoints.push(v);
    }
    return arcPoints;
  }

  //
  // C) onMount
  //
  onMount(() => {
    // 1) Szene, Kamera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000106);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // 2) Bloom
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.85
    );
    composer.addPass(bloomPass);

    // 3) Licht
    const ambientLight = new THREE.AmbientLight(0x4C65B9, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 12, 4);
    pointLight.position.set(2, 2, 3);
    scene.add(pointLight);

    const pointLightLeft = new THREE.PointLight(0x456390, 20, 10);
    pointLightLeft.position.set(-2, -2, 2);
    scene.add(pointLightLeft);

    // 4) Globus
    const globeGeometry = new THREE.SphereGeometry(1, 64, 64);
    const globeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x171a26,
      opacity: 1,
      transparent: false,
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    // 5) OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // 6) Punkte platzieren
    sortedData.forEach((entry) => {
      const { latitude, longitude, date } = entry;
      const pastOrToday = isPastOrToday(date);
      const exactlyToday = isToday(date);

      // Farbe: 
      // - Gelb (heute), 
      // - Weiß (Vergangenheit), 
      // - Grau (Zukunft)
      let color = 0x777777; // Default = Grau (Zukunft)
      if (pastOrToday) {
        color = 0xffffff;   // Weiß
      }
      if (exactlyToday) {
        color = 0xffff00;   // Gelb
      }

      // Kleiner Haupt-Marker
      const markerGeometry = new THREE.SphereGeometry(0.003, 16, 16);
      const markerMaterial = new THREE.MeshBasicMaterial({ color });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);

      marker.position.copy(latLonToCartesian(latitude, longitude, 1.02));
      scene.add(marker);

      // Falls vergangen ODER heute => Glow-Punkt
      // (je nach Geschmack könntest du "heute" auch stärker leuchten lassen)
      if (pastOrToday || exactlyToday) {
        const glowGeometry = new THREE.SphereGeometry(0.006, 16, 16); 
        const glowMaterial = new THREE.MeshBasicMaterial({
          color,          // gleiche Farbe
          transparent: true,
          opacity: 1,     // intensiver Glow
        });
        const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
        glowSphere.position.copy(marker.position);
        scene.add(glowSphere);
      }
    });

    // 7) Routenlinien
    for (let i = 0; i < sortedData.length - 1; i++) {
      const curr = sortedData[i];
      const next = sortedData[i + 1];

      // Falls das Zieldatum (next) noch in der Zukunft liegt, => skip
      if (!isPastOrToday(next.date)) {
        continue;
      }

      const startPos = latLonToCartesian(curr.latitude, curr.longitude, 1.005);
      const endPos   = latLonToCartesian(next.latitude, next.longitude, 1.005);

      // Bogen
      const arcPoints = createArc(startPos, endPos, 64, 0.05);
      const geometry  = new THREE.BufferGeometry().setFromPoints(arcPoints);

      // Linienfarbe: Weiß
      const routeMat   = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
      const routeLine = new THREE.Line(geometry, routeMat);
      scene.add(routeLine);
    }

    // 8) Ländergrenzen
    fetch("/world.json")
      .then((res) => res.json())
      .then((geojson) => {
        drawBorders(geojson);
      })
      .catch((err) => console.error("GeoJSON-Fehler:", err));

    function drawBorders(geojson) {
      const borderMaterial = new THREE.LineBasicMaterial({
        color: 0x212935,
        linewidth: 2,
      });

      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x172039,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
      });

      geojson.features.forEach((feature) => {
        if (feature.geometry.type === "Polygon") {
          feature.geometry.coordinates.forEach((ring) => {
            const points = ring.map((coord) => {
              const [lon, lat] = coord;
              return latLonToCartesian(lat, lon, 1.005);
            });

            if (points.length > 0) {
              points.push(points[0].clone());
            }

            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, borderMaterial);
            scene.add(line);

            const glowLine = new THREE.Line(geometry, glowMaterial);
            glowLine.scale.set(1.25, 1.25, 1.25);
            scene.add(glowLine);
          });
        } else if (feature.geometry.type === "MultiPolygon") {
          feature.geometry.coordinates.forEach((polygon) => {
            polygon.forEach((ring) => {
              const points = ring.map((coord) => {
                const [lon, lat] = coord;
                return latLonToCartesian(lat, lon, 1.005);
              });

              if (points.length > 0) {
                points.push(points[0].clone());
              }

              const geometry = new THREE.BufferGeometry().setFromPoints(points);
              const line = new THREE.Line(geometry, borderMaterial);
              scene.add(line);

              const glowLine = new THREE.Line(geometry, glowMaterial);
              glowLine.scale.set(1, 1, 1);
              scene.add(glowLine);
            });
          });
        }
      });
    }

    // 9) Auto-Rotation Toggle
    container.addEventListener("click", () => {
      autoRotate = !autoRotate;
    });

    // 10) Animation
    function animate() {
      requestAnimationFrame(animate);
      if (autoRotate) {
        globe.rotation.y += 0.001;
      }
      controls.update();
      composer.render();
    }
    animate();

    // 11) Resize
    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    });
  });
</script>

<style>
  :global(body) {
    margin: 0;
    overflow: hidden;
  }
  div {
    width: 100vw;
    height: 100vh;
  }
</style>

<div bind:this={container}></div>
