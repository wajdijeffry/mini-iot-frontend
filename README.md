# mini-iot-frontend

Ionic Angular frontend for the Live IoT Data Monitor. Displays real-time outdoor temperature and humidity readings from the [mini-iot-backend](https://github.com/wajdijeffry/mini-iot-backend) API, with a historical log and auto-refresh.

## Tech Stack

- Ionic 7 + Angular 22 (standalone components, signals)
- `HttpClient` for API calls
- Chart.js + ng2-charts for the trend chart and per-card sparklines
- Browser Geolocation API for real, non-hardcoded sensor location

## Prerequisites

- Node.js **v22.22.3 or higher** (Angular 22's CLI requires this — check with `node --version`)
- The [mini-iot-backend](https://github.com/wajdijeffry/mini-iot-backend) running locally on `http://localhost:3000`

## Setup

```bash
git clone https://github.com/wajdijeffry/mini-iot-frontend.git
cd mini-iot-frontend
npm install -g @ionic/cli   # if not already installed
npm install
```

## Run

Make sure the backend is running first (`npm run start:dev` in `mini-iot-backend`), then:

```bash
ionic serve
```

Opens at `http://localhost:8100`.

## Features

- **Live header** — pulsing LIVE badge and a "last update Xs ago" indicator, calculated from the latest reading's real timestamp
- **Sensor cards** — temperature and humidity, each showing the current value, the delta from the previous reading, a NORMAL/WARNING status derived from configurable thresholds, and a small sparkline of recent values
- **Environment status** — a compact summary ("Comfortable" / "Warning") derived from the same thresholds, not hardcoded
- **Combined trend chart** — dual-axis line chart (°C and %) of the last 15 readings for each sensor, using Chart.js
- **Recent Readings table** — temperature and humidity combined per timestamp, with a status indicator
- **Auto-refresh** — polls the backend every 10 seconds
- **Pull-to-refresh** — swipe down on the page to manually sync
- **Real geolocation** — on load, requests the browser's location and sends it to the backend (`POST /api/sensor-data/location`) so Open-Meteo returns data for the user's actual location instead of a fixed coordinate. Falls back gracefully to the backend's default location if permission is denied.

## Project Structure

```
src/app/
├── home/
│   ├── home.page.ts       # Dashboard component (signals-based state, chart config, geolocation)
│   ├── home.page.html     # Cards, chart, status, and readings table template
│   └── home.page.scss     # Dark gradient theme, card styling, animations
└── services/
    └── sensor.ts          # SensorService — HttpClient wrapper (GET data, POST location)
```

## Notes

- Built with Angular's zoneless change detection (default in Angular 22), so component state uses `signal()` rather than plain class properties to ensure the UI updates correctly when new data arrives.
- The backend API URL is hardcoded to `http://localhost:3000` in `sensor.ts` — update this if running the backend elsewhere.
- Geolocation requires the user to grant permission in the browser. On `localhost` this works over plain HTTP in Chrome; some browsers may require HTTPS on non-localhost origins.
- Status thresholds (temperature/humidity NORMAL vs WARNING ranges) are defined as constants in `home.page.ts` and can be adjusted there.
