import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { thermometerOutline, waterOutline, timeOutline, arrowUp, arrowDown, remove } from 'ionicons/icons';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, Chart, registerables } from 'chart.js';
import { SensorService, SensorReading } from '../services/sensor';

Chart.register(...registerables);

// Simple comfort thresholds — adjust as needed
const TEMP_LOW = 20;
const TEMP_HIGH = 32;
const HUMIDITY_LOW = 30;
const HUMIDITY_HIGH = 80;

interface CombinedReading {
  timestamp: string;
  temperature: number | null;
  humidity: number | null;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonGrid,
    IonRow,
    IonCol,
    BaseChartDirective,
  ],
})
export class HomePage implements OnInit, OnDestroy {
  history = signal<SensorReading[]>([]);
  now = signal<number>(Date.now());
  private refreshIntervalId: ReturnType<typeof setInterval> | null = null;
  private clockIntervalId: ReturnType<typeof setInterval> | null = null;

  temperatureReadings = computed(() =>
    this.history().filter((r) => r.sensor_name === 'outdoor_temperature')
  );

  humidityReadings = computed(() =>
    this.history().filter((r) => r.sensor_name === 'outdoor_humidity')
  );

  latestTemperature = computed(() => this.temperatureReadings()[0] ?? null);
  latestHumidity = computed(() => this.humidityReadings()[0] ?? null);

  // Delta from previous reading
  temperatureDelta = computed(() => {
    const readings = this.temperatureReadings();
    if (readings.length < 2) return null;
    return +(readings[0].value - readings[1].value).toFixed(1);
  });

  humidityDelta = computed(() => {
    const readings = this.humidityReadings();
    if (readings.length < 2) return null;
    return +(readings[0].value - readings[1].value).toFixed(1);
  });

  // Status per sensor, based on real thresholds
  temperatureStatus = computed(() => {
    const temp = this.latestTemperature()?.value;
    if (temp == null) return null;
    if (temp < TEMP_LOW || temp > TEMP_HIGH) return 'WARNING';
    return 'NORMAL';
  });

  humidityStatus = computed(() => {
    const hum = this.latestHumidity()?.value;
    if (hum == null) return null;
    if (hum < HUMIDITY_LOW || hum > HUMIDITY_HIGH) return 'WARNING';
    return 'NORMAL';
  });

  overallStatus = computed(() => {
    if (this.temperatureStatus() === 'WARNING' || this.humidityStatus() === 'WARNING') {
      return {
        label: 'Warning',
        detail: this.temperatureStatus() === 'WARNING'
          ? 'Temperature is outside the configured range.'
          : 'Humidity is outside the configured range.',
        color: '#ffc409',
      };
    }
    if (this.latestTemperature() && this.latestHumidity()) {
      return {
        label: 'Comfortable',
        detail: 'Temperature and humidity are currently stable.',
        color: '#2dd36f',
      };
    }
    return { label: 'Loading…', detail: 'Waiting for sensor data.', color: 'var(--ion-color-medium)' };
  });

  // Seconds since last reading, for "Last update Xs ago"
  secondsSinceUpdate = computed(() => {
    const latest = this.history()[0];
    if (!latest) return null;
    const diffMs = this.now() - new Date(latest.timestamp).getTime();
    return Math.max(0, Math.floor(diffMs / 1000));
  });

  // Combined rows for the Recent Readings table — pairs temp+humidity by matching timestamps
  recentReadings = computed<CombinedReading[]>(() => {
    const temps = this.temperatureReadings().slice(0, 10);
    const combined: CombinedReading[] = temps.map((t) => {
      const matchingHumidity = this.humidityReadings().find(
        (h) => Math.abs(new Date(h.timestamp).getTime() - new Date(t.timestamp).getTime()) < 5000
      );
      return {
        timestamp: t.timestamp,
        temperature: t.value,
        humidity: matchingHumidity?.value ?? null,
      };
    });
    return combined;
  });

    chartData = computed<ChartData<'line'>>(() => {
    const tempReadings = this.temperatureReadings().slice(0, 15).reverse();
    const humidityReadings = this.humidityReadings().slice(0, 15).reverse();

    return {
      labels: tempReadings.map((r) =>
        new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      ),
      datasets: [
        {
          data: tempReadings.map((r) => r.value),
          label: 'Temperature (°C)',
          borderColor: '#eb445a',
          backgroundColor: 'rgba(235, 68, 90, 0.12)',
          fill: true,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 5,
          borderWidth: 2,
          yAxisID: 'y',
        },
        {
          data: humidityReadings.map((r) => r.value),
          label: 'Humidity (%)',
          borderColor: '#3880ff',
          backgroundColor: 'rgba(56, 128, 255, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 5,
          borderWidth: 2,
          yAxisID: 'y1',
        },
      ],
    };
  });

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: { usePointStyle: true, boxWidth: 8, font: { family: 'Roboto' } },
      },
      tooltip: {
        backgroundColor: 'rgba(20, 20, 25, 0.95)',
        padding: 10,
        cornerRadius: 8,
        titleFont: { family: 'Roboto' },
        bodyFont: { family: 'Roboto' },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { font: { family: 'Roboto', size: 11 } },
      },
      y: {
        type: 'linear',
        position: 'left',
        title: { display: true, text: '°C', font: { family: 'Roboto' } },
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { font: { family: 'Roboto', size: 11 } },
      },
      y1: {
        type: 'linear',
        position: 'right',
        title: { display: true, text: '%', font: { family: 'Roboto' } },
        grid: { drawOnChartArea: false },
        ticks: { font: { family: 'Roboto', size: 11 } },
      },
    },
  };

  // Sparkline mini-charts (no axes, just a trend line)
  temperatureSparkline = computed<ChartData<'line'>>(() => {
    const readings = this.temperatureReadings().slice(0, 10).reverse();
    return {
      labels: readings.map(() => ''),
      datasets: [{
        data: readings.map((r) => r.value),
        borderColor: '#eb445a',
        backgroundColor: 'rgba(235, 68, 90, 0.15)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
      }],
    };
  });

  humiditySparkline = computed<ChartData<'line'>>(() => {
    const readings = this.humidityReadings().slice(0, 10).reverse();
    return {
      labels: readings.map(() => ''),
      datasets: [{
        data: readings.map((r) => r.value),
        borderColor: '#3880ff',
        backgroundColor: 'rgba(56, 128, 255, 0.15)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
      }],
    };
  });

  sparklineOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: {
      x: { display: false },
      y: { display: false },
    },
    elements: { point: { radius: 0 } },
  };

  constructor(private sensorService: SensorService) {
    addIcons({ thermometerOutline, waterOutline, timeOutline, arrowUp, arrowDown, remove });
  }

    ngOnInit() {
    this.loadData();
    this.requestLocation();
    this.refreshIntervalId = setInterval(() => this.loadData(), 10000);
    this.clockIntervalId = setInterval(() => this.now.set(Date.now()), 1000);
  }

  private requestLocation() {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported by this browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        this.sensorService.setLocation(latitude, longitude).subscribe({
          next: () => console.log(`Location sent to backend: ${latitude}, ${longitude}`),
          error: (err) => console.error('Failed to send location to backend', err),
        });
      },
      (error) => {
        console.warn('Geolocation permission denied or unavailable:', error.message);
      }
    );
  }

  ngOnDestroy() {
    if (this.refreshIntervalId) clearInterval(this.refreshIntervalId);
    if (this.clockIntervalId) clearInterval(this.clockIntervalId);
  }

  loadData() {
    this.sensorService.getSensorData().subscribe({
      next: (response) => this.history.set(response.history),
      error: (err: any) => console.error('Failed to load sensor data', err),
    });
  }

  handleRefresh(event: any) {
    this.sensorService.getSensorData().subscribe({
      next: (response) => {
        this.history.set(response.history);
        event.target.complete();
      },
      error: (err: any) => {
        console.error('Failed to refresh sensor data', err);
        event.target.complete();
      },
    });
  }
}