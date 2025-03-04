import OpenAI from "openai";
import { findCurrentEntry } from "../utils/timeUtils.js"; // ✅ Nutzt jetzt die utils-Funktion!
import { data } from "../data/routeData.js"; // Sicherstellen, dass der Pfad korrekt ist!

const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
});

export async function getDailyMessage() {
    const todayStop = findCurrentEntry(data); // ✅ Nutzt jetzt die korrekte Zeitlogik aus `timeUtils.js`

    if (!todayStop) {
        return "Couldn't find today's location. Please try again later.";
    }

    const { date, port, atSea } = todayStop;

    let nicknames = ["Nightowly", "my Laopo", "babe", "little princess"];
    let randomNickname = nicknames[Math.floor(Math.random() * nicknames.length)];
    let affectionateGreetings = ["sunshine", "darling", "love", "beautiful", "gorgeous"];
    let randomGreeting = affectionateGreetings[Math.floor(Math.random() * affectionateGreetings.length)];
    
    let prompt = atSea
        ? `Today is ${date}, and my ${randomNickname} is at sea. Send her a smooth and confident message about enjoying the ocean breeze, the beauty of open waters, and a little seafarer wisdom. Keep it under 350 characters—cool, engaging, and full of warmth.`
        : `Today is ${date}, and my ${randomNickname} has arrived in ${port}. Greet her with a stylish welcome, calling her ${randomGreeting}, and suggest either a great bar, a must-visit restaurant, or a cool sight to check out. Keep it under 350 characters—charming, effortless, and full of rizz.`;
    
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 100,
            temperature: 0.7
        });

        const message = completion.choices[0]?.message?.content || "No message today. 🌊💙";

        localStorage.setItem("dailyMessage", JSON.stringify({ date, message }));

        return message;
    } catch (error) {
        console.error("Error fetching message:", error);
        return "Error loading the message. 😔";
    }
}
