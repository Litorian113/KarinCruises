import { data } from "../data/routeData.js";

export function getCurrentLocation() {
    const todayLocal = new Date().toISOString().split("T")[0]; // Aktuelles Datum im Format YYYY-MM-DD

    // 1️⃣ Suche nach dem Eintrag mit dem heutigen Datum
    let todayEntry = data.find(entry => entry.date === todayLocal);

    // 2️⃣ Falls kein Eintrag gefunden wird, gib eine Standardantwort zurück
    if (!todayEntry) {
        return { location: "Unknown", atSea: false, timeZone: "UTC" };
    }

    // 3️⃣ Falls das Schiff auf See ist, suche den nächsten Hafen
    if (todayEntry.atSea) {
        let nextPort = data.find(entry => entry.date > todayLocal && !entry.atSea);
        return {
            location: "At Sea",
            atSea: true,
            timeZone: nextPort ? nextPort.timeZone : "UTC"
        };
    }

    // 4️⃣ Falls das Schiff in einem Hafen ist, gib die Hafeninfos zurück
    return {
        location: todayEntry.port,
        atSea: false,
        timeZone: todayEntry.timeZone
    };
}
