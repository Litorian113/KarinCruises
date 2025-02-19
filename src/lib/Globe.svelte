<script>
  import { onMount } from "svelte";
  import * as THREE from "three";
  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
  import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
  import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
  import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";

  import { data } from "/src/data/routeData.js";

  let container;           // Referenz auf das <div> im Template
  let autoRotate = true;
  
  // Datum
  let today = new Date();
  today.setHours(0, 0, 0, 0);

  function parseDDMMYYYY(dateString) {
    const [day, month, year] = dateString.split(".");
    return new Date(+year, +month - 1, +day);
  }

  function isPastOrToday(dateString) {
    const d = parseDDMMYYYY(dateString);
    d.setHours(0, 0, 0, 0);
    return d <= today;
  }

  function isToday(dateString) {
    const d = parseDDMMYYYY(dateString);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  }

  const sortedData = [...data]
    .filter((entry) => {
      if (entry.atSea) return false;
      if (entry.latitude === null || entry.longitude === null) return false;
      return true;
    })
    .sort((a, b) => parseDDMMYYYY(a.date) - parseDDMMYYYY(b.date));

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

  onMount(() => {
    // Szene, Kamera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000106);

    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Post-Processing
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(100, 100), // placeholder, wird im handleResize gesetzt
      1.5,
      0.4,
      0.85
    );
    composer.addPass(bloomPass);

    // Licht
    const ambientLight = new THREE.AmbientLight(0x4C65B9, 0.9);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 12, 4);
    pointLight.position.set(2, 2, 3);
    scene.add(pointLight);

    const pointLightLeft = new THREE.PointLight(0x456390, 20, 10);
    pointLightLeft.position.set(-2, -2, 2);
    scene.add(pointLightLeft);

    // Globus
    const globeGeometry = new THREE.SphereGeometry(1, 64, 64);
    const globeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x282D42,
      transparent: false,
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Punkte
    sortedData.forEach((entry) => {
      const { latitude, longitude, date } = entry;
      const isPast = isPastOrToday(date);
      const isTdy = isToday(date);

      let color = 0x777777; // Zukunft = grau
      if (isPast) color = 0xffffff;
      if (isTdy) color = 0xffff00;

      const markerGeom = new THREE.SphereGeometry(0.003, 16, 16);
      const markerMat  = new THREE.MeshBasicMaterial({ color });
      const marker     = new THREE.Mesh(markerGeom, markerMat);
      marker.position.copy(latLonToCartesian(latitude, longitude, 1.02));
      scene.add(marker);

      if (isPast || isTdy) {
        const glowGeom = new THREE.SphereGeometry(0.006, 16, 16);
        const glowMat  = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 1,
        });
        const glowSphere = new THREE.Mesh(glowGeom, glowMat);
        glowSphere.position.copy(marker.position);
        scene.add(glowSphere);
      }
    });

    // Linien (nur bis heute)
    for (let i = 0; i < sortedData.length - 1; i++) {
      const curr = sortedData[i];
      const next = sortedData[i + 1];
      if (!isPastOrToday(next.date)) continue;

      const startPos = latLonToCartesian(curr.latitude, curr.longitude, 1.005);
      const endPos   = latLonToCartesian(next.latitude, next.longitude, 1.005);
      const arcPoints = createArc(startPos, endPos, 64, 0.05);
      const geometry  = new THREE.BufferGeometry().setFromPoints(arcPoints);
      const routeMat  = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
      const routeLine = new THREE.Line(geometry, routeMat);
      scene.add(routeLine);
    }

    // Ländergrenzen
    fetch("/world.json")
      .then(res => res.json())
      .then(geojson => {
        drawBorders(geojson);
      })
      .catch(err => console.error("GeoJSON-Fehler:", err));

    function drawBorders(geojson) {
      const borderMaterial = new THREE.LineBasicMaterial({
        color: 0x172039,
        linewidth: 2,
      });
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x172039,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
      });

      geojson.features.forEach(feature => {
        const { type } = feature.geometry;
        if (type === "Polygon") {
          feature.geometry.coordinates.forEach(ring => {
            makePolygon(ring);
          });
        } else if (type === "MultiPolygon") {
          feature.geometry.coordinates.forEach(polygon => {
            polygon.forEach(ring => makePolygon(ring));
          });
        }
      });

      function makePolygon(ring) {
        const points = ring.map(([lon, lat]) => latLonToCartesian(lat, lon, 1.005));
        if (points.length > 0) {
          points.push(points[0].clone());
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        scene.add(new THREE.Line(geometry, borderMaterial));

        const glowLine = new THREE.Line(geometry, glowMaterial);
        glowLine.scale.set(1, 1, 1);
        scene.add(glowLine);
      }
    }

    // Klick toggelt autoRotate
    container.addEventListener("click", () => {
      autoRotate = !autoRotate;
    });

    // Resize-Handler => nutze container.clientWidth/Height
    function handleResize() {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    }

    // Einmal beim Start anpassen:
    handleResize();

    // + Listener auf window
    window.addEventListener("resize", handleResize);

    // Animationsschleife
    function animate() {
      requestAnimationFrame(animate);
      if (autoRotate) {
        globe.rotation.y += 0.001;
      }
      controls.update();
      composer.render();
    }
    animate();
  });
</script>

<style>
  /* Container füllt 100% in Breite/Höhe, 
     aber die HÖHE legt das Eltern-Element fest (z.B. 70vh) */
  div {
    width: 100%;
    height: 100%;
  }
</style>

<div bind:this={container}></div>
