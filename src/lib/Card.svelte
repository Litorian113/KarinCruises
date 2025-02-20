<script>
    import { onMount, onDestroy } from "svelte";
    import { format, toZonedTime } from "date-fns-tz";
    import { parse } from "date-fns";
    import { data } from "../data/routeData.js";
    
    let currentEntry = null;
    let portName = "";
    let arrival = null;
    let departure = null;
    let cardElement;
    let inView = false;
    let observer;
    let observerTimeout;
    
    // Wir ersetzen hier die Rechner-Zeit durch "America/New_York".
    // So wird das "heutige" Datum anhand der lokalen Zeit in Amerika bestimmt.
    function findTodayEntry(dataset) {
      // Erzeuge das "jetzt" in der gewünschten Zeitzone (z. B. America/New_York).
      const localNow = toZonedTime(new Date(), "America/New_York");
      const todayStr = format(localNow, "dd.MM.yyyy");
      return dataset.find(e => e.date === todayStr) ?? null;
    }
    
    onMount(() => {
      currentEntry = findTodayEntry(data);
      if (currentEntry) {
        if (currentEntry.atSea) {
          portName = "At Sea";
        } else {
          portName = currentEntry.port;
          arrival = currentEntry.arrival || null;
          departure = currentEntry.departure || null;
        }
      }
    
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
      if (cardElement) {
        observer.observe(cardElement);
      }
    });
    
    onDestroy(() => {
      if (observer && cardElement) {
        observer.unobserve(cardElement);
      }
      clearTimeout(observerTimeout);
    });
</script>
    
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
