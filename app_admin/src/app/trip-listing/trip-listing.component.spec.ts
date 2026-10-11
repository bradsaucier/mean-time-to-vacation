import { TestBed } from '@angular/core/testing';

import { provideRouter } from '@angular/router';

import { HttpErrorResponse } from '@angular/common/http';

import { Subject, of, throwError } from 'rxjs';

import { describe, it, beforeEach, expect, vi } from 'vitest';

import { Trip } from '../models/trip';

import { TripDataService } from '../services/trip-data.service';

import { TripListingComponent } from './trip-listing.component';

import { MOCK_TRIP } from '../testing/mock-trips';

describe('Trip listing', () => {
  const data = { getTrips: vi.fn(), deleteTrip: vi.fn() };
  beforeEach(() => {
    data.getTrips.mockReset();
    data.deleteTrip.mockReset();
    TestBed.configureTestingModule({
      imports: [TripListingComponent],
      providers: [provideRouter([]), { provide: TripDataService, useValue: data }],
    });
  });
  it('renders loading, mock cards, filtering and successful deletion', async () => {
    const source = new Subject<Trip[]>();
    data.getTrips.mockReturnValue(source);
    data.deleteTrip.mockReturnValue(of(undefined));
    const fixture = TestBed.createComponent(TripListingComponent);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Loading the manifest');
    source.next([MOCK_TRIP]);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('app-trip-card').length).toBe(1);
    fixture.componentInstance.query.set('no match');
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('No trips match');
    fixture.componentInstance.query.set('');
    fixture.componentInstance.remove(MOCK_TRIP.code);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('app-trip-card').length).toBe(0);
  });
  it('keeps a trip when deletion fails', async () => {
    data.getTrips.mockReturnValue(of([MOCK_TRIP]));
    data.deleteTrip.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    const fixture = TestBed.createComponent(TripListingComponent);
    await fixture.whenStable();
    fixture.componentInstance.remove(MOCK_TRIP.code);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('app-trip-card').length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Cannot reach');
  });
  it('offers an add action for an empty manifest', async () => {
    data.getTrips.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(TripListingComponent);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('No trips are on');
  });
  it('shows a server outage and can retry', async () => {
    data.getTrips.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    const fixture = TestBed.createComponent(TripListingComponent);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Cannot reach');
    data.getTrips.mockReturnValue(of([MOCK_TRIP]));
    fixture.nativeElement.querySelector('.alert-danger button').click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('app-trip-card').length).toBe(1);
  });
});

describe('Save notice lifetime', () => {
  it('clears confirmation when leaving the listing', async () => {
    TestBed.configureTestingModule({
      imports: [TripListingComponent],
      providers: [
        provideRouter([]),
        { provide: TripDataService, useValue: { getTrips: () => of([MOCK_TRIP]) } },
      ],
    });
    const fixture = TestBed.createComponent(TripListingComponent);
    await fixture.whenStable();
    fixture.componentInstance.notices.show(MOCK_TRIP.code, MOCK_TRIP.name, 'added');
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Trip added.');
    fixture.destroy();
    expect(fixture.componentInstance.notices.notice()).toBeNull();
  });
});
