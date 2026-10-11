import { TestBed } from '@angular/core/testing';

import { provideHttpClient } from '@angular/common/http';

import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { describe, it, beforeEach, afterEach, expect } from 'vitest';

import { TripDataService } from './trip-data.service';

import { MOCK_TRIP } from '../testing/mock-trips';

describe('Trip API contract', () => {
  let service: TripDataService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TripDataService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('retrieves collection and single object', () => {
    service.getTrips().subscribe((trips) => expect(trips[0].code).toBe(MOCK_TRIP.code));
    http.expectOne('http://localhost:3000/api/trips').flush([MOCK_TRIP]);
    service.getTrip(MOCK_TRIP.code).subscribe((trip) => expect(trip.name).toBe(MOCK_TRIP.name));
    http.expectOne('http://localhost:3000/api/trips/' + MOCK_TRIP.code).flush(MOCK_TRIP);
  });
  it('posts, puts and deletes with the correct methods', () => {
    service.addTrip(MOCK_TRIP).subscribe();
    let req = http.expectOne('http://localhost:3000/api/trips');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.code).toBe(MOCK_TRIP.code);
    req.flush(MOCK_TRIP);
    service.updateTrip(MOCK_TRIP.code, MOCK_TRIP).subscribe();
    req = http.expectOne('http://localhost:3000/api/trips/' + MOCK_TRIP.code);
    expect(req.request.method).toBe('PUT');
    req.flush(MOCK_TRIP);
    service.deleteTrip(MOCK_TRIP.code).subscribe();
    req = http.expectOne('http://localhost:3000/api/trips/' + MOCK_TRIP.code);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
  it('preserves server conflicts', () => {
    let status = 0;
    service.addTrip(MOCK_TRIP).subscribe({ error: (error) => (status = error.status) });
    http
      .expectOne('http://localhost:3000/api/trips')
      .flush({ message: 'Duplicate' }, { status: 409, statusText: 'Conflict' });
    expect(status).toBe(409);
  });
});
