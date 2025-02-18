<script>
  import { onMount } from "svelte";
  import * as THREE from "three";
  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

  let container;
  let autoRotate = true;

  // Hilfsfunktion: Wandelt Breitengrad (lat) und Längengrad (lon) in 3D-Koordinaten auf einer Kugel um
  function latLonToCartesian(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    return new THREE.Vector3(x, y, z);
  }

  onMount(() => {
    // Szene, Kamera und Renderer initialisieren
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

    // Weiches Ambient Light
    const ambientLight = new THREE.AmbientLight(0x4C65B9, 0.8); // sanfte Umgebungsbeleuchtung
    scene.add(ambientLight);

    // Weiches Punktlicht von oben rechts
    const pointLight = new THREE.PointLight(0xFFFFFF, 12, 4);
    pointLight.position.set(2, 2, 3); // Position oben rechts
    scene.add(pointLight);

    // Neues PointLight von unten links
    const pointLightLeft = new THREE.PointLight(0x456390, 20, 10);
    pointLightLeft.position.set(-2, -2, 2); // Position unten links
    scene.add(pointLightLeft);

    // Globus erstellen – Verwende ein MeshPhysicalMaterial für einen glasartigen Look
    const globeGeometry = new THREE.SphereGeometry(1, 64, 64);
    const globeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x171A26,
      opacity: 1,
      transparent: false,
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    // OrbitControls für Mausinteraktion
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Beispiel-Marker (kleine rote Kugeln)
    // const markerGeometry = new THREE.SphereGeometry(0.03, 16, 16);
    // const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x2B3447 });
    // const marker1 = new THREE.Mesh(markerGeometry, markerMaterial);
    // marker1.position.copy(latLonToCartesian(0, 0, 1.02));
    // scene.add(marker1);
    // const marker2 = new THREE.Mesh(markerGeometry, markerMaterial);
    // marker2.position.copy(latLonToCartesian(45, 45, 1.02));
    // scene.add(marker2);
    // const marker3 = new THREE.Mesh(markerGeometry, markerMaterial);
    // marker3.position.copy(latLonToCartesian(-30, 120, 1.02));
    // scene.add(marker3);

    // Ländergrenzen laden und auf den Globus projizieren
    fetch("/world.json")
      .then((res) => res.json())
      .then((geojson) => {
        drawBorders(geojson);
      })
      .catch((err) => console.error("GeoJSON-Fehler:", err));

    function drawBorders(geojson) {
      const borderMaterial = new THREE.LineBasicMaterial({
        color: 0x212935,  // Normale Farbe der Linien
        linewidth: 2,     // Normale Linienbreite
      });

      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x032C9D,  // Leuchtende Farbe (z.B. Grün für Glow)
        transparent: true,
        opacity: 0.7,     // Transparenz des Glows, erhöhe sie für stärkeren Effekt
        side: THREE.DoubleSide, // Beide Seiten sichtbar
      });

      geojson.features.forEach((feature) => {
        if (feature.geometry.type === "Polygon") {
          feature.geometry.coordinates.forEach((ring) => {
            const points = ring.map((coord) => {
              const [lon, lat] = coord; // GeoJSON: [lon, lat]
              return latLonToCartesian(lat, lon, 1.005);
            });
            if (points.length > 0) {
              points.push(points[0].clone()); // Geschlossene Linie
            }

            // Normale Linie für das Land
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, borderMaterial);
            scene.add(line);

            // Glow-Effekt durch zusätzliche große Linie
            const glowGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const glowLine = new THREE.Line(geometry, glowMaterial);
            glowLine.scale.set(1.25, 1.25, 1.25); // Vergrößere die Glow-Linie weiter, um den "Schweif"-Effekt zu erzeugen
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
                points.push(points[0].clone()); // Geschlossene Linie
              }

              // Normale Linie für das Land
              const geometry = new THREE.BufferGeometry().setFromPoints(points);
              const line = new THREE.Line(geometry, borderMaterial);
              scene.add(line);

              // Glow-Effekt durch zusätzliche große Linie
              const glowGeometry = new THREE.BufferGeometry().setFromPoints(points);
              const glowLine = new THREE.Line(geometry, glowMaterial);
              glowLine.scale.set(1.001, 1.001, 1.001); // Vergrößere die Glow-Linie weiter
              scene.add(glowLine);
            });
          });
        }
      });
    }

    // Klick-Event: Umschalten der Auto-Rotation
    container.addEventListener("click", () => {
      autoRotate = !autoRotate;
    });

    // Animationsschleife
    function animate() {
      requestAnimationFrame(animate);
      if (autoRotate) {
        globe.rotation.y += 0.001;
      }
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Anpassung bei Fenstergrößenänderung
    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
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
