import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SensorReading {
  id: number;
  sensor_name: string;
  value: number;
  timestamp: string;
}

export interface SensorDataResponse {
  latest: SensorReading | null;
  history: SensorReading[];
}

@Injectable({
  providedIn: 'root',
})
export class SensorService {
  private readonly apiUrl = 'http://localhost:3000/api/sensor-data';

  constructor(private http: HttpClient) {}

  getSensorData(): Observable<SensorDataResponse> {
    return this.http.get<SensorDataResponse>(this.apiUrl);
  }

  setLocation(latitude: number, longitude: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/location`, { latitude, longitude });
  }
}