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
  IonList,
  IonItem,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/angular';
import { SensorService, SensorReading } from '../services/sensor';

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
    IonList,
    IonItem,
    IonLabel,
    IonRefresher,
    IonRefresherContent,
    IonGrid,
    IonRow,
    IonCol,
  ],
})
export class HomePage implements OnInit, OnDestroy {
  history = signal<SensorReading[]>([]);
  private refreshIntervalId: ReturnType<typeof setInterval> | null = null;

  // Derived: latest temperature reading only
  latestTemperature = computed(() =>
    this.history().find((r) => r.sensor_name === 'outdoor_temperature') ?? null
  );

  // Derived: latest humidity reading only
  latestHumidity = computed(() =>
    this.history().find((r) => r.sensor_name === 'outdoor_humidity') ?? null
  );

  constructor(private sensorService: SensorService) {}

  ngOnInit() {
    this.loadData();
    this.refreshIntervalId = setInterval(() => {
      this.loadData();
    }, 10000);
  }

  ngOnDestroy() {
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
    }
  }

  loadData() {
    this.sensorService.getSensorData().subscribe({
      next: (response) => {
        this.history.set(response.history);
      },
      error: (err: any) => {
        console.error('Failed to load sensor data', err);
      },
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