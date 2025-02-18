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

  // Heutiges Datum (auf 0 Uhr gesetzt)
  let today = new Date();
  today.setHours(0, 0, 0, 0);

  // Hilfsfunktion zum Parsen eines "DD.MM.YYYY"-Strings in ein Date-Objekt
  function parseDDMMYYYY(dateString) {
    // Beispiel: "11.02.2025"
    const [day, month, year] = dateString.split(".");
    return new Date(+year, +month - 1, +day); 
  }

  // Prüft, ob dateString (DD.MM.YYYY) <= heute
  function isPastOrToday(dateString) {
    const d = parseDDMMYYYY(dateString);
    d.setHours(0, 0, 0, 0);
    return d <= today;
  }

  // Sortiere die Daten nach Datum aufsteigend
  // UND filtern wir gleich die Einträge raus, die atSea=true ODER lat/lon=null
  const sortedData = [...data]
    .filter((entry) => {
      // atSea-Datensätze oder latitude/longitude=null weglassen
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

  // Wandelt Breitengrad (lat) + Längengrad (lon) in 3D-Koordinaten auf einer Kugel um
  function latLonToCartesian(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    return new THREE.Vector3(x, y, z);
  }

  // Manuelle Slerp-Funktion für Vector3
  function slerpVec3(a, b, t) {
    let dot = a.dot(b);
    dot = Math.min(Math.max(dot, -1), 1);

    const theta = Math.acos(dot) * t;
    const relative = b.clone().sub(a.clone().multiplyScalar(dot));
    relative.normalize();

    return a.clone().multiplyScalar(Math.cos(theta))
             .add(relative.multiplyScalar(Math.sin(theta)));
  }

  /**
   * Erzeugt einen Großkreis-Bogen zwischen startPos und endPos
   * mit zusätzlicher "extraHeight", sodass die Mitte merklich über der Kugel schwebt.
   *
   * @param {THREE.Vector3} startPos - 3D-Koordinate des Startpunktes (Radius ~ 1.005)
   * @param {THREE.Vector3} endPos - 3D-Koordinate des Endpunktes
   * @param {number} segments - Anzahl Segmente (z.B. 64)
   * @param {number} extraHeight - maximale Höhe über dem normalen Radius (z.B. 0.05)
   */
  function createArc(startPos, endPos, segments = 32, extraHeight = 0.05) {
    const vStart = startPos.clone().normalize();
    const vEnd   = endPos.clone().normalize();

    const rA = startPos.length();
    const rB = endPos.length();
    // Durchschnittlicher Basis-Radius
    const avgRadius = (rA + rB) / 2;

    const arcPoints = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      // Slerp auf Einheitskugel
      let v = slerpVec3(vStart, vEnd, t);

      // Nun "Wölbung": in der Mitte (t=0.5) am höchsten, via sin(π * t)
      // => sin(0) = 0, sin(π) = 0, sin(π/2)=1
      const arcFactor = Math.sin(Math.PI * t);
      // Extrapolierte Höhe
      const addedHeight = extraHeight * arcFactor;

      // Mit (Basis-Radius + addedHeight) skalieren
      v.multiplyScalar(avgRadius + addedHeight);

      arcPoints.push(v);
    }
    return arcPoints;
  }

  //
  // C) onMount SVELTE
  //
  onMount(() => {
    //
    // 1) Szene, Kamera, Renderer
    //
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

    //
    // 2) Post-Processing (Bloom)
    //
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

    //
    // 3) Licht
    //
    const ambientLight = new THREE.AmbientLight(0x4C65B9, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 12, 4);
    pointLight.position.set(2, 2, 3);
    scene.add(pointLight);

    const pointLightLeft = new THREE.PointLight(0x456390, 20, 10);
    pointLightLeft.position.set(-2, -2, 2);
    scene.add(pointLightLeft);

    //
    // 4) Globus
    //
    const globeGeometry = new THREE.SphereGeometry(1, 64, 64);
    const globeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x171a26,
      opacity: 1,
      transparent: false,
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    //
    // 5) OrbitControls
    //
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    //
    // 6) Punkte platzieren (Marker)
    //    - Weiß + Glow, wenn Datum <= heute; Grau sonst.
    //
    sortedData.forEach((entry) => {
      const { latitude, longitude, date } = entry;
      const isPast = isPastOrToday(date);

      // Hauptfarbe: Weiß (Vergangenheit) oder Grau (Zukunft)
      const color = isPast ? 0xffffff : 0x777777;

      // Kleiner Haupt-Marker
      const markerGeometry = new THREE.SphereGeometry(0.003, 16, 16);
      const markerMaterial = new THREE.MeshBasicMaterial({ color });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);

      marker.position.copy(latLonToCartesian(latitude, longitude, 1.02));
      scene.add(marker);

      // Falls vergangen/aktuell → leuchtenden Glow-Punkt hinzufügen
      if (isPast) {
        const glowGeometry = new THREE.SphereGeometry(0.006, 16, 16); 
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 1,
        });
        const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
        glowSphere.position.copy(marker.position);
        scene.add(glowSphere);
      }
    });

    //
// 7) Route (Linien) zwischen aufeinanderfolgenden Datenpunkten
for (let i = 0; i < sortedData.length - 1; i++) {
  const curr = sortedData[i];
  const next = sortedData[i + 1];

  // Falls das Zieldatum (next) noch in der Zukunft liegt, 
  // dann skippen wir das Zeichnen der Linie.
  if (!isPastOrToday(next.date)) {
    continue;
  }

  // Start / End
  const startPos = latLonToCartesian(curr.latitude, curr.longitude, 1.005);
  const endPos   = latLonToCartesian(next.latitude, next.longitude, 1.005);

  // Erzeuge Slerp-Punkte (Großkreis) + Aufwölbung
  const arcPoints = createArc(startPos, endPos, 64, 0.05);
  const geometry  = new THREE.BufferGeometry().setFromPoints(arcPoints);

  // Linienfarbe: Weiß, da es ja Vergangenheit/Heute ist (bereits erreicht)
  const routeColor = 0xffffff;
  const routeMat   = new THREE.LineBasicMaterial({ color: routeColor, linewidth: 2 });

  const routeLine = new THREE.Line(geometry, routeMat);
  scene.add(routeLine);
}

    //
    // 8) Ländergrenzen
    //
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

    //
    // 9) Klick-Event: Umschalten der Auto-Rotation
    //
    container.addEventListener("click", () => {
      autoRotate = !autoRotate;
    });

    //
    // 10) Animationsschleife
    //
    function animate() {
      requestAnimationFrame(animate);
      if (autoRotate) {
        globe.rotation.y += 0.001;
      }
      controls.update();
      composer.render();
    }
    animate();

    //
    // 11) Fenster-Resize
    //
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
