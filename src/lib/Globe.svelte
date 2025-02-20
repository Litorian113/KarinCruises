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

  // Funktion, um ein Text-Sprite zu erstellen
  function createTextSprite(message, parameters = {}) {
    const fontface        = parameters.fontface        || "Space Grotesk";
    const fontsize        = parameters.fontsize        || 50;
    const textColor       = parameters.textColor       || "rgba(255, 255, 255, 1.0)";
    const borderThickness = parameters.borderThickness || 4;
    const borderColor     = parameters.borderColor     || { r: 0, g: 0, b: 0, a: 1.0 };
    const backgroundColor = parameters.backgroundColor || { r: 0, g: 0, b: 0, a: 0 };
    const scaleFactor     = parameters.scaleFactor     || 0.04; // Faktor für die Sprite-Größe

    // Canvas anlegen und 2D-Kontext holen
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    // Schriftmaße berechnen
    context.font = fontsize + "px " + fontface;
    const metrics = context.measureText(message);
    const textWidth = metrics.width;

    // Canvas-Größe entsprechend anpassen
    canvas.width  = textWidth + borderThickness * 2;
    canvas.height = fontsize * 1.4 + borderThickness * 2;

    // Hintergrund (optional transparent)
    context.fillStyle = `rgba(${backgroundColor.r}, ${backgroundColor.g}, ${backgroundColor.b}, ${backgroundColor.a})`;
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Text zeichnen
    context.font = fontsize + "px " + fontface;
    context.fillStyle = textColor;
    context.fillText(message, borderThickness, fontsize + borderThickness);

    // Aus Canvas eine Texture erstellen
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    // Sprite-Material und Sprite erzeugen
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);

    // Sprite skalieren
    sprite.scale.set(scaleFactor * (canvas.width / canvas.height), scaleFactor, 1);

    return sprite;
  }

  onMount(async () => {
    // Warte, bis der Font "Space Grotesk" geladen ist,
    // sodass er beim Rendern des Canvas verfügbar ist.
    await document.fonts.load('24px "Space Grotesk"');

    // Szene, Kamera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000106);

    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 1.8;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Post-Processing
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(100, 100), // placeholder, wird im handleResize gesetzt
      1,  // strength (Intensität)
      0.4,  // radius
      0.85  // threshold (ab wann es "blüht")
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
        color: 0x01859C,
        linewidth: 2,
      });
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x01859C,
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

    // Hier fügen wir die Logik für die Labels hinzu:
    // Filtere alle Hafen-Einträge (ohne "atSea")
    const portData = sortedData.filter(entry => !entry.atSea);

    // Bestimme den letzten Hafen bis heute (aktueller Hafen)
    const pastPorts = portData.filter(entry => isPastOrToday(entry.date));
    const currentPortData = pastPorts.length > 0 ? pastPorts[pastPorts.length - 1] : null;

    // Bestimme den ersten Hafen nach heute (nächster Hafen)
    const upcomingPorts = portData.filter(entry => !isPastOrToday(entry.date));
    const nextPortData = upcomingPorts.length > 0 ? upcomingPorts[0] : null;

    if (currentPortData) {
  const currentPos = latLonToCartesian(currentPortData.latitude, currentPortData.longitude, 1.02);
  const currentLabel = createTextSprite(currentPortData.port, {
    fontsize: 40,
    textColor: "rgba(255,255,0,1.0)", // Gelb
    scaleFactor: 0.03
  });
  currentLabel.position.copy(currentPos).add(new THREE.Vector3(0, 0.03, 0));
  currentLabel.renderOrder = 999;
  // currentLabel.material.depthTest = false;
  scene.add(currentLabel);
}

if (nextPortData) {
  const nextPos = latLonToCartesian(nextPortData.latitude, nextPortData.longitude, 1.02);
  const nextLabel = createTextSprite(nextPortData.port, {
    fontsize: 40,
    textColor: "rgba(255,255,255,1.0)",
    scaleFactor: 0.03
  });
  nextLabel.position.copy(nextPos).add(new THREE.Vector3(0, 0.03, 0));
  nextLabel.renderOrder = 999;
  // nextLabel.material.depthTest = false;
  scene.add(nextLabel);
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

<div bind:this={container}></div>

<style>
  @font-face {
    font-family: "Space Grotesk";
    src: url("/fonts/Spacegrotesk/SpaceGrotesk-Regular.ttf") format("truetype");
    font-weight: 400;
    font-style: normal;
  }

  @font-face {
    font-family: "Space Grotesk";
    src: url("/fonts/Spacegrotesk/SpaceGrotesk-Bold.ttf") format("truetype");
    font-weight: 700;
    font-style: normal;
  }
  /* Container füllt 100% in Breite/Höhe, 
     aber die HÖHE legt das Eltern-Element fest (z. B. 70vh) */
  div {
    width: 100%;
    height: 100%;
  }
</style>
