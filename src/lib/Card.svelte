<script>
  import { onMount, onDestroy } from "svelte";
  import { findCurrentEntry, timeUntilNextDay } from "../utils/timeUtils.js";
  import { data } from "../data/routeData.js";

  let currentEntry = null;
  let portName = "";
  let arrival = null;
  let departure = null;
  let cardElement;
  let inView = false;
  let observer;
  let observerTimeout;
  let interval;

  function updateEntry() {
    console.log("🔄 Starte Hafen-Update...");

    const newEntry = findCurrentEntry(data);

    if (newEntry !== currentEntry) {
      console.log("🚀 Hafen hat gewechselt!", newEntry);
    } else {
      console.log("🔁 Kein Wechsel – gleich geblieben:", newEntry);
    }

    currentEntry = newEntry;

    if (currentEntry) {
      portName = currentEntry.atSea ? "At Sea" : currentEntry.port;
      arrival = currentEntry.arrival || null;
      departure = currentEntry.departure || null;

      console.log(`🌍 Hafen: ${portName}, Ankunft: ${arrival}, Abfahrt: ${departure}`);

      if (currentEntry.timeZone) {
        const countdown = timeUntilNextDay(currentEntry.timeZone);
        console.log(`⏳ Zeit bis zum nächsten Hafenwechsel (${currentEntry.timeZone}): ${countdown.hours}h ${countdown.minutes}m ${countdown.seconds}s`);
      }
    }
  }

  onMount(() => {
    console.log("⏳ Initialisiere `Card.svelte`...");
    updateEntry();

    // Prüft jede Minute den Hafen und die verbleibende Zeit
    interval = setInterval(updateEntry, 60000);

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          clearTimeout(observerTimeout);
          observerTimeout = setTimeout(() => {
            inView = entry.intersectionRatio === 1;
          }, 200);
        });
      },
      { threshold: 1 }
    );

    if (cardElement) observer.observe(cardElement);
  });

  onDestroy(() => {
    console.log("🛑 `Card.svelte` wird zerstört...");
    clearInterval(interval);
    if (observer && cardElement) observer.unobserve(cardElement);
    clearTimeout(observerTimeout);
  });
</script>

<div class="cardContainer">
<div class="card" bind:this={cardElement} class:in-view={inView}>
  <img src="/wheel.png" alt="Wheel icon" class="icon" />
  <p>Karin today you are at:</p>
  {#if !currentEntry}
    <div class="port">No data for today</div>
  {:else if currentEntry.atSea}
    <div class="port">Sea</div>
  {:else}
    <div class="port">{portName}</div>
    <div class="row">
      <div class="item">Arrival:</div>
      <div class="item">{arrival}</div>
    </div>
    <div class="row">
      <div>Departure:</div>
      <div>{departure}</div>
    </div>
  {/if}
</div>
</div>

<style>
.cardContainer {
  position: relative;
  width: fit-content;
  display: inline-flex;
  justify-content: center;
  align-items: center;
}

.card {
  width: 240px;
  height: 280px;
  padding: 1rem;
  color: #fff;
  font-family: "Space Grotesk", sans-serif;
  text-align: center;
  align-content: center;
  border-radius: 32px;
  background: linear-gradient(
    141deg,
    rgba(0, 1, 6, 0.3) 0%,
    rgba(23, 239, 236, 0.3) 100%
  );
  backdrop-filter: blur(20px) saturate(1.2);
  opacity: 0.5;
  transform: scale(1);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.card.in-view {
  opacity: 1;
  transform: scale(1.05);
}

.icon {
  width: 40px;
  margin-bottom: 0.5rem;
}

.port {
  font-size: 2rem;
  margin: 0.5rem 0;
  line-height: 2rem;
  margin-bottom: 30px;
  margin-top: -5px;
}

.row {
  display: flex;
  flex-direction: row;
  width: 70%;
  justify-content: space-between;
  margin: 0.25rem 0;
  font-size: 0.8rem;
  margin-left: 30px;
}

.item {
    display: flex;
    gap: 20px;
}
</style>
