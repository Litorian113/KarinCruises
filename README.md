# SvelteKit Travel Globe Project

## Overview
This project is a **SvelteKit-based web application** that visualizes a traveler's journey using a **3D globe powered by Three.js**. The application updates daily to show the current location and the next travel destination. Additional functionalities include displaying local time, travel schedules, and AI-generated travel tips.

## Features

### 🌍 Interactive 3D Globe
- Displays the traveler's current location with a **glowing yellow dot**.
- Shows future travel destinations as **white dots**.
- Connects the current location to the next destination with a **line**.

### 📌 Info Cards
1. **Current Location Info Card**
   - Displays the **port name**.
   - Shows **arrival and departure times**.
   
2. **Time & Travel Info Card**
   - Displays **current local time**.
   - If docked at a port, shows **time spent at the location**.
   - If en route, shows **time remaining until next arrival**.

### 📝 AI-Powered Travel Guide
- A **textarea input** allows users to generate travel recommendations.
- Utilizes the **ChatGPT API** to suggest sightseeing spots and great bars **based on the current or upcoming port**.

### 📲 Morning Push Notifications
- Sends a **daily notification** with:
  - **Current location**
  - **Local time**
  - **Essential travel updates**

## Installation

```bash
npm install --legacy-peer-deps
npm run dev
```

## TODOs
- [ ] Implement a **webhook for push notifications** with summarized key data.

## Contributing
Pull requests and feature suggestions are welcome! If you find any issues, feel free to report them.

## License
This project is licensed under the **MIT License**.
