<script>
    import { onMount, onDestroy } from "svelte";
    import { format, toZonedTime } from "date-fns-tz";
    import { parse } from "date-fns";
    import { data } from "../data/routeData.js";
    
    // Parst "DD.MM.YYYY" -> Date
    function parseDateString(ddmmyyyy) {
      return parse(ddmmyyyy, "dd.MM.yyyy", new Date());
    }
    
    // Heute oder nächster Hafen, falls atSea
    function findCurrentEntry(dataset) {
      const today = new Date();
      const todayStr = format(today, "dd.MM.yyyy");
      let entry = dataset.find(e => e.date === todayStr);
      if (!entry || entry.atSea) {
        let future = dataset.filter(e =>
          parseDateString(e.date) >= parseDateString(todayStr) && !e.atSea
        );
        future.sort((a, b) => parseDateString(a.date) - parseDateString(b.date));
        entry = future[0] ?? null;
      }
      return entry;
    }
    
    function getLocalTime(zone) {
      const nowUtc = new Date();
      const zonedDate = toZonedTime(nowUtc, zone);
      return format(zonedDate, "HH:mm", { timeZone: zone });
    }
    
    // Prüft, ob "now" < arrival => "Time to arrival"
    // falls arrival <= now < departure => "Time to departure"
    // falls now >= departure => null
    function computeTimeLeft(entry) {
      if (!entry?.timeZone) return null;
      const now = toZonedTime(new Date(), entry.timeZone);
      const baseDate = parse(entry.date, "dd.MM.yyyy", new Date());
      const arrivalTime = entry.arrival ? entry.arrival : null;
      const departureTime = entry.departure ? entry.departure : null;
      let arrivalMs = null;
      let departureMs = null;
      if (arrivalTime) {
        const [aH, aM] = arrivalTime.split(":");
        baseDate.setHours(+aH, +aM, 0, 0);
        arrivalMs = baseDate.getTime();
      }
      let baseDate2 = parse(entry.date, "dd.MM.yyyy", new Date());
      if (departureTime) {
        const [dH, dM] = departureTime.split(":");
        baseDate2.setHours(+dH, +dM, 0, 0);
        departureMs = baseDate2.getTime();
      }
      const nowMs = now.getTime();
      if (arrivalMs && nowMs < arrivalMs) {
        const diff = arrivalMs - nowMs;
        return {
          label: "Time to arrival",
          diff: msToDiffString(diff),
        };
      }
      if (arrivalMs && departureMs && nowMs >= arrivalMs && nowMs < departureMs) {
        const diff = departureMs - nowMs;
        return {
          label: "Time to departure",
          diff: msToDiffString(diff),
        };
      }
      return null;
    }
    
    function msToDiffString(diffMs) {
      if (diffMs <= 0) return null;
      const diffMinutes = Math.floor(diffMs / 60000);
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours}h ${String(minutes).padStart(2, "0")}m`;
    }
    
    let currentEntry = null;
    let localTime = null;
    let timeLeft = null;
    let timer;
    
    // Variablen für den IntersectionObserver:
    let cardElement;
    let inView = false;
    let observer;
    let observerTimeout;
    
    function updateTime() {
      if (currentEntry?.timeZone) {
        localTime = getLocalTime(currentEntry.timeZone);
        timeLeft = computeTimeLeft(currentEntry);
      } else {
        localTime = "--:--";
        timeLeft = null;
      }
    }
    
    onMount(() => {
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
      clearInterval(timer);
      if (observer && cardElement) observer.unobserve(cardElement);
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
  