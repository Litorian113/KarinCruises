<script>
    import { onMount } from "svelte";
    import { findCurrentEntry } from "../utils/timeUtils.js"; // ✅ Holt den aktuellen Hafen korrekt
    import { getDailyMessage } from "$lib/openai.js";
    import { writable } from "svelte/store";
    import { data } from "../data/routeData.js";

    let message = writable(""); // Für den animierten Text
    let fullMessage = ""; // Speichert die gesamte Nachricht vor der Animation
    let locationData;
    let loading = true; // Zum Anzeigen der Ladeanimation

    async function fetchMessage() {
        loading = true;
        locationData = findCurrentEntry(data); // ✅ Jetzt die korrekte Zeitlogik!
        fullMessage = await getDailyMessage();

        message.set(""); // Startet die Animation mit leerem Text
        typewriterEffect(fullMessage);
        loading = false;
    }

    function typewriterEffect(text) {
        let i = 0;
        const interval = setInterval(() => {
            message.update(msg => msg + text[i]);
            i++;
            if (i === text.length) clearInterval(interval);
        }, 40); // Geschwindigkeit: 40ms pro Zeichen
    }

    onMount(fetchMessage);
</script>

<section class="message-container">
    <h2>📩 Little daily note 😘</h2>
    {#if loading}
        <p>Loading message...</p>
    {:else}
        <p>{$message}<span class="blinking-cursor">|</span></p>
    {/if}
</section>

<style>
    .message-container {
        height: 30vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: left;
        padding: 40px;
        background: #000106;
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    
    h2 {
        color: #088589;
        margin-bottom: 10px;
    }
    
    p {
        font-size: 1.2rem;
        color: #f8f9fa;
        white-space: pre-wrap;
    }

    .blinking-cursor {
        display: inline-block;
        width: 10px;
        background: white;
        margin-left: 5px;
        animation: blink 1s infinite;
    }

    @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
    }
</style>
