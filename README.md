# mini-iot-frontend

Ionic Angular frontend for the Live IoT Data Monitor. Displays real-time outdoor temperature and humidity readings from the [mini-iot-backend](https://github.com/wajdijeffry/mini-iot-backend) API, with a historical log and auto-refresh.

## Tech Stack

- Ionic 7 + Angular 22 (standalone components, signals)
- `HttpClient` for API calls

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

- **Current readings** — separate cards for the latest temperature and humidity values
- **Historical list** — scrollable log of all past readings, newest first
- **Auto-refresh** — polls the backend every 10 seconds
- **Pull-to-refresh** — swipe down on the page to manually sync

## Project Structure

```
src/app/
├── home/
│   ├── home.page.ts       # Dashboard component (signals-based state)
│   └── home.page.html     # Cards + historical list template
└── services/
    └── sensor.ts          # SensorService — HttpClient wrapper for the backend API
```

## Notes

- Built with Angular's zoneless change detection (default in Angular 22), so component state uses `signal()` rather than plain class properties to ensure the UI updates correctly when new data arrives.
- The backend API URL is hardcoded to `http://localhost:3000` in `sensor.ts` — update this if running the backend elsewhere.
