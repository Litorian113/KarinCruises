<script>
  import { onMount, onDestroy } from "svelte";
  import { findCurrentEntry, computeTimeLeft, getLocalTime } from "../utils/timeUtils.js";
  import { data } from "../data/routeData.js";

  let currentEntry = null;
  let localTime = null;
  let timeLeft = null;
  let timer;
  let cardElement;
  let inView = false;
  let observer;
  let observerTimeout;

  function updateTime() {
      if (currentEntry?.timeZone) {
          localTime = getLocalTime(currentEntry.timeZone);
          timeLeft = computeTimeLeft(currentEntry, data);
      } else {
          localTime = "--:--";
          timeLeft = null;
      }
  }

  onMount(() => {
      console.log("⏳ Initialisiere `Timecard.svelte`...");
      currentEntry = findCurrentEntry(data);
      updateTime();
      timer = setInterval(updateTime, 60000);

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
      console.log("🛑 `Timecard.svelte` wird zerstört...");
      clearInterval(timer);
      if (observer && cardElement) observer.unobserve(cardElement);
      clearTimeout(observerTimeout);
  });
</script>

<div class="cardContainer">
  <div class="card" bind:this={cardElement} class:in-view={inView}>
      <img src="/clock.png" alt="clock icon" class="icon" />
      <p id="lessgap">Current local time:</p>
      <div class="big-time">{localTime}</div>
      
      {#if timeLeft}
      <div class="abschnitt">
          <div>
              <p class="time">{timeLeft.label}:</p>
          </div>
          <div>
              <p class="time">{timeLeft.diff}</p>
          </div>
      </div>
      {:else}
      <p>No arrival upcoming or already in port.</p>
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

  .big-time {
      font-size: 2rem;
      margin: 0.5rem 0;
      font-family: "Space Grotesk", sans-serif;
      font-weight: 400;
      margin-top: 0px;
      margin-bottom: 20px;
  }

  p {
      font-size: 1rem;
  }

  .icon {
      width: 40px;
      margin-bottom: 0.5rem;
  }

  #lessgap {
      margin-bottom: 0px;
  }

  .time {
      font-size: 0.8rem;
  }

  .abschnitt {
      display: flex;
      flex-direction: row;
      justify-content: center;
      gap: 20px;
  }
</style>
