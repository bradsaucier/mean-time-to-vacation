import { inject, Injectable } from '@angular/core';

import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { Observable } from 'rxjs';

import { Trip, TripInput } from '../models/trip';

import { User } from '../models/user';

import { AuthResponse } from '../models/auth-response';

@Injectable({ providedIn: 'root' })
export class TripDataService {
  private readonly http = inject(HttpClient);
  readonly baseUrl = 'http://localhost:3000/api';
  private readonly url = this.baseUrl + '/trips';
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
  // Call to our /login endpoint, returns JWT
  login(user: User, passwd: string): Observable<AuthResponse> {
    return this.handleAuthAPICall('login', user, passwd);
  }
  // Call to our /register endpoint, creates user and returns JWT
  register(user: User, passwd: string): Observable<AuthResponse> {
    return this.handleAuthAPICall('register', user, passwd);
  }
  // Helper method to process both login and register methods
  handleAuthAPICall(endpoint: string, user: User, passwd: string): Observable<AuthResponse> {
    const formData = { name: user.name, email: user.email, password: passwd };
    return this.http.post<AuthResponse>(this.baseUrl + '/' + endpoint, formData);
  }
}
export function describeHttpError(error: HttpErrorResponse): string {
  return error.status === 0
    ? 'Cannot reach the trip server. Check that Express is running, then try again.'
    : error.error?.message || 'The request failed. Try again.';
}
