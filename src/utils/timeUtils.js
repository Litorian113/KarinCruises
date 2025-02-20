import { format, toZonedTime } from "date-fns-tz";
import { parse } from "date-fns";

// Hilfsfunktion zur Umwandlung eines Datums-Strings (dd.MM.yyyy) in ein Date-Objekt
function parseDateString(dateString) {
  const [day, month, year] = dateString.split(".");
  return new Date(+year, +month - 1, +day);
}

// ✅ Funktion `computeTimeLeft` richtig exportieren
export function computeTimeLeft(entry, dataset) {
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

  // Falls das Schiff abgelegt hat, sofort die nächste Ankunft berechnen
  if (departureMs && nowMs >= departureMs) {
    console.log("🚢 Schiff hat abgelegt – Suche nach dem nächsten Hafen!");

    let futurePorts = dataset.filter(e =>
      parseDateString(e.date) > parseDateString(entry.date) && !e.atSea
    );
    futurePorts.sort((a, b) => parseDateString(a.date) - parseDateString(b.date));

    const nextEntry = futurePorts[0] ?? null;
    if (nextEntry) {
      const nextArrivalTime = nextEntry.arrival ? nextEntry.arrival : null;
      if (nextArrivalTime) {
        const nextBaseDate = parse(nextEntry.date, "dd.MM.yyyy", new Date());
        const [nH, nM] = nextArrivalTime.split(":");
        nextBaseDate.setHours(+nH, +nM, 0, 0);
        const nextArrivalMs = nextBaseDate.getTime();
        const diff = nextArrivalMs - nowMs;

        return {
          label: "Time to arrival",
          diff: msToDiffString(diff),
        };
      }
    }
  }

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

export function findCurrentEntry(dataset) {
  if (!dataset || dataset.length === 0) return null;

  let latestEntryWithZone = dataset.find(e => e.timeZone) || { timeZone: "UTC" };
  const timeZone = latestEntryWithZone.timeZone;

  const localNow = toZonedTime(new Date(), timeZone);
  const todayStr = format(localNow, "dd.MM.yyyy");

  console.log("⏳ Aktuelle Zeit in der Zeitzone des Hafens:", localNow);
  console.log("📅 Berechnetes heutiges Datum in dieser Zeitzone:", todayStr);
  console.log("🌍 Genutzte Zeitzone:", timeZone);

  let entry = dataset.find(e => e.date === todayStr);

  if (!entry || entry.atSea) {
    console.log("🚢 Kein Hafen für heute gefunden oder auf See – suche den nächsten Hafen...");
    let futureEntries = dataset.filter(e =>
      parseDateString(e.date) >= parseDateString(todayStr) && !e.atSea
    );
    futureEntries.sort((a, b) => parseDateString(a.date) - parseDateString(b.date));
    entry = futureEntries[0] ?? null;
  }

  console.log("📍 Gefundener Hafen-Eintrag:", entry);
  return entry;
}

export function getLocalTime(zone) {
  const nowUtc = new Date();
  const zonedDate = toZonedTime(nowUtc, zone);
  return format(zonedDate, "HH:mm", { timeZone: zone });
}

export function timeUntilNextDay(timeZone) {
  const now = toZonedTime(new Date(), timeZone);
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0); 

  const diffMs = nextMidnight - now;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  console.log(`⏳ Zeit bis zum nächsten Hafenwechsel (${timeZone}): ${hours}h ${minutes}m ${seconds}s`);

  return { hours, minutes, seconds };
}

export function msToDiffString(diffMs) {
  if (diffMs <= 0) return null;
  const diffMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}
