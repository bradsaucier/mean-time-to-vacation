import { inject, Injectable } from '@angular/core';

import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { Trip, TripInput } from '../models/trip';

@Injectable({ providedIn: 'root' })
export class TripDataService {
  private readonly http = inject(HttpClient);
  private readonly url = 'http://localhost:3000/api/trips';
  getTrips() {
    return this.http.get<Trip[]>(this.url);
  }
  getTrip(code: string) {
    return this.http.get<Trip>(this.url + '/' + encodeURIComponent(code));
  }
  addTrip(trip: TripInput) {
    return this.http.post<Trip>(this.url, trip);
  }
  updateTrip(code: string, trip: TripInput) {
    return this.http.put<Trip>(this.url + '/' + encodeURIComponent(code), trip);
  }
  deleteTrip(code: string) {
    return this.http.delete<void>(this.url + '/' + encodeURIComponent(code));
  }
}
export function describeHttpError(error: HttpErrorResponse): string {
  return error.status === 0
    ? 'Cannot reach the trip server. Check that Express is running, then try again.'
    : error.error?.message || 'The request failed. Try again.';
}
